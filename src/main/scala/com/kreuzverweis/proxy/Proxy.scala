/**
 *
 */
package com.kreuzverweis.proxy
import unfiltered.netty.async.Plan
import unfiltered.request._
import unfiltered.response.ResponseString
import unfiltered.netty.ServerErrorResponse
import dispatch._
import oauth._
import OAuth._
import unfiltered.Cookie
import unfiltered.response.Unauthorized
import unfiltered.response.InternalServerError
import unfiltered.response.BadRequest
import unfiltered.response.Ok
import unfiltered.response.MethodNotAllowed

/**
 * @author carsten
 *
 */
object Proxy extends Plan with ServerErrorResponse {
  val h = new Http
  val prefix = url("http://kvnode1.uni-koblenz.de:8080/keywords/by-prefix")
  val proposal = url("http://kvnode1.uni-koblenz.de:8080/keywords/proposals")
  val credentials = url("http://kvnode1.uni-koblenz.de:8080/oauth/web-credentials")
  val consumer = Consumer("kreuzverweis-web", "Yohv9aiQuaigiasheiSo")
  
	def intent = {
	  case req @ POST(Path("/credentials")) => {
	    try {
		    val Params(form) = req
		    println("form: %s".format(form.toString))
		    if (!form.isDefinedAt("email")) {
		      req.respond(BadRequest ~> ResponseString("No email specified."))
		    } else {
  		    h(credentials << Map("email" -> form("email").head)  >- { res =>
  		      req.respond(Ok)
  		    })
	      }
	    } catch {
	      case e => req.respond(InternalServerError ~> ResponseString(e.getMessage()))
	    }
	  }
	  case req @ GET(Path(Seg("by-prefix" :: term :: Nil))) & Cookies(cookies) & Params(params) => {
	    val limit = if (params.isDefinedAt("limit")) Map("limit" -> params("limit").head) else Map[String, String]()
	    getToken(cookies) match {
	      case Some(token) =>
		    	val a = prefix / term <<? limit
		    	try {
			    	h(a <@ (consumer, token) >- { res =>
			    		req.respond(ResponseString(res))
			    	})
	    		} catch {
	    			case StatusCode(401, m) => req.respond(Unauthorized ~> ResponseString("No credentials supplied."))
	    			case e => req.respond(InternalServerError ~> ResponseString(e.getMessage))
	    		}
	      case None => req.respond(Unauthorized ~> ResponseString("No credentials supplied."))
	    }
	  }
	  case req @ GET(Path(Seg("proposals" :: terms :: Nil))) & Cookies(cookies) & Params(params) => {
	    val limit = if (params.isDefinedAt("limit")) Map("limit" -> params("limit").head) else Map[String, String]()
	    getToken(cookies) match {
	      case Some(token) =>
			    val a = proposal / terms <<? limit
			    val r = a <@ (consumer, token)
		    	try {
				    h(r >- { res =>
				    	req.respond(ResponseString(res))
				    })
	    		} catch {
	    			case StatusCode(401, m) => req.respond(Unauthorized ~> ResponseString("No credentials supplied."))
	    			case e => req.respond(InternalServerError ~> ResponseString(e.getMessage))
	    		}
	      case None => req.respond(Unauthorized ~> ResponseString("No credentials supplied."))
	    }
	  }	  
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
  }
  
}