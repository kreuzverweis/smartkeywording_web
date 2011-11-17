/** embedded server */
package com.kreuzverweis.proxy

import java.io.File

object Server {
  val logger = org.clapper.avsl.Logger(Server.getClass)
  val http = new dispatch.nio.Http

  def main(args: Array[String]) {
    val port = if (args.headOption.isDefined) args.head.toInt else 8888
    unfiltered.netty.Http(port)
      .handler(Proxy)
      .resources((new File("static")).toURI().toURL())
      .run { s =>
        logger.info("starting unfiltered app at localhost on port %s"
                    .format(s.port))
      }
    http.shutdown()
  }
  
}
