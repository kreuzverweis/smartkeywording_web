/**
   
   Copyright 2012 Kreuzverweis Solutions GmbH

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
         
**/
package com.kreuzverweis.proxy
import unfiltered.response.ResponseString
import dispatch._
import oauth._
import OAuth._
import unfiltered.Cookie
import unfiltered.response.Unauthorized
import unfiltered.response.InternalServerError
import unfiltered.response.BadRequest
import unfiltered.response.Ok
import unfiltered.response.MethodNotAllowed
import unfiltered.filter._
import unfiltered.request._

/**
 * @author carsten
 *
 */
object Proxy extends Plan {
  val h = new Http with thread.Safety
  var keywording: Request = null
  var backoffice: Request = null
  var client = ("", "")
  lazy val completions = keywording / "completions"
  lazy val proposal = keywording / "proposals"
  lazy val users = backoffice / "users"
  def tokens(id: String) = backoffice / "users" / id / "tokens" 

  def intent = {
    case req @ POST(Path("/users")) => {
      try {
        val r = users << Map("client" -> client._1, "secret" -> client._2)
        println(r.to_uri)
        println(scala.io.Source.fromInputStream(r.body.get.getContent).getLines().mkString("\n"))
        h(r >- { res =>
          println("res")
          println(res.toString)
          ResponseString(res)
        })
      } catch {
        case e => {
          InternalServerError ~> ResponseString(e.getMessage())
        }
      }
    }
    case req @ POST(Path(Seg("users" :: id :: "tokens" :: Nil))) => {
      try {
        val r = tokens(id) << Map("client" -> client._1, "secret" -> client._2) 
        println(r.to_uri)
        println(scala.io.Source.fromInputStream(r.body.get.getContent).getLines().mkString("\n"))
        h(r >- { res =>
          ResponseString(res)
        })
      } catch {
        case e => {
          InternalServerError ~> ResponseString(e.getMessage())
        }
      }
    }
    case req @ GET(Path(Seg("completions" :: term :: Nil))) & Cookies(cookies) & Params(params) & AcceptLanguage(lang) => {
      getToken(cookies) match {
        case Some(token) =>
          val a = completions / term <<? translateParameters(params) <:< Map("Accept-Language" -> (lang mkString ","), "Authorization" ->  "Bearer %s".format(token))
          try {
            h(a >- { res =>
              ResponseString(res)
            })
          } catch {
            case StatusCode(401, m) => Unauthorized ~> ResponseString("No credentials supplied.")
            case e => InternalServerError ~> ResponseString(e.getMessage)
          }
        case None => Unauthorized ~> ResponseString("No credentials supplied.")
      }
    }
    case req @ GET(Path(Seg("proposals" :: terms :: Nil))) & Cookies(cookies) & Params(params) & AcceptLanguage(lang) => {
      getToken(cookies) match {
        case Some(token) =>
          val p = translateParameters(params)
          val reqparams = if (cookies.isDefinedAt("split")) {
            val ret = p filter { case (k, v) => k != "split" }
            val split = cookies("split").get.value
            ret.toList :+ (("split", split))
          } else {
            p
          }
          val a = proposal / terms <<? reqparams
          val r = a <:< Map("Accept-Language" -> (lang mkString ","), "Authorization" ->  "Bearer %s".format(token))
          try {
            h(r >- { res =>
              ResponseString(res)
            })
          } catch {
            case StatusCode(401, m) => Unauthorized ~> ResponseString("No credentials supplied.")
            case e => InternalServerError ~> ResponseString(e.getMessage)
          }
        case None => Unauthorized ~> ResponseString("No credentials supplied.")
      }
    }
  }

  def translateParameters(params: Map[String, Seq[String]]): Traversable[(String, String)] = {
    for {
      pk <- params.keys
      v <- params(pk)
    } yield (pk, v)
  }

  def getToken(cookies: Map[String, Option[Cookie]]): Option[String] = {
    for {
      tokenc <- cookies.get("token")
      token <- tokenc
    } yield {
      token match {
        case Cookie(_, token, _, _, _, _) =>
          token
      }
    }
    //    Some(Token("9ccbf691-93f0-4411-b0a6-b4c712ffef72", "55b15110-d027-456d-bdb0-d1eb9860d212"))
  }

}
