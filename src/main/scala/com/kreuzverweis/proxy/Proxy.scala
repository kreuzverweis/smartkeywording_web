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
  var server: Request = url("http://kvnode1.uni-koblenz.de:8080/")
  val consumer = Consumer("kreuzverweis-web", "Yohv9aiQuaigiasheiSo")
  lazy val prefix = server / "keywords/completions"
  lazy val proposal = server / "keywords/proposals"
  lazy val credentials = server / "oauth/web-credentials"
  
	def intent = {
	  case req @ POST(Path("/credentials")) => {
	    try {
		    h(credentials << Map()  >- { res =>
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
		    	val a = prefix / term <<? translateParameters(params, cookies)  <:< Map("Accept-Language" -> (lang mkString ","))
		    	try {
			    	h(a <@ (consumer, token) >- { res =>
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
	        val p = translateParameters(params, cookies)
          val reqparams = if (cookies.isDefinedAt("split")) {
            val ret = p filter {case (k, v) => k != "split"}
            val split = cookies("split").get.value
            ret.toList :+ (("split", split))
          } else {
            p
          }
			    val a = proposal / terms <<? reqparams
			    val r = a <@ (consumer, token) <:< Map("Accept-Language" -> (lang mkString ","))
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
  
  def translateParameters(params: Map[String, Seq[String]], cookies: Map[String, Option[unfiltered.Cookie]]): Traversable[(String, String)] = {
    for {
      pk <- params.keys
      v <- params(pk)
    } yield (pk, v)
  }
  
  def getToken(cookies: Map[String, Option[Cookie]]): Option[Token] = { 
    for {
    	tokenc <- cookies.get("token")
    	secretc <- cookies.get("secret")
    	token <- tokenc
    	secret <- secretc
    } yield {
    	token match {
  			case Cookie(_, token, _, _, _, _) =>
  				secret match {
  					case Cookie(_, secret, _, _, _, _) =>
       				Token(token, secret)  
  				}
  			}
    }
//    Some(Token("9ccbf691-93f0-4411-b0a6-b4c712ffef72", "55b15110-d027-456d-bdb0-d1eb9860d212"))
  }
  
}
