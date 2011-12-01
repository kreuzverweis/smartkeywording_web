/** embedded server */
package com.kreuzverweis.proxy

import java.io.File

object Server {
  val logger = org.clapper.avsl.Logger(Server.getClass)
  val http = new dispatch.nio.Http

  def main(args: Array[String]) {
    val port = if (args.headOption.isDefined) args.head.toInt else 8888
    val baseUri = if (args.drop(1).headOption.isDefined) Proxy.server = args.drop(1).head
    unfiltered.jetty.Http(port)
      .filter(Proxy)
      .resources((new File("static")).toURI().toURL())
      .run { s =>
        logger.info("starting unfiltered app at localhost on port %s"
                    .format(s.port))
      }
    http.shutdown()
  }
  
}
