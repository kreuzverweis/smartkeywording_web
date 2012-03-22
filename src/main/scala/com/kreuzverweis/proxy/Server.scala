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

/** embedded server */
package com.kreuzverweis.proxy

import java.io.File
import dispatch.url

object Server {
  val logger = org.clapper.avsl.Logger(Server.getClass)
  val http = new dispatch.nio.Http

  def main(args: Array[String]) {
    val client = args.headOption.get
    val secret = args.drop(1).headOption.get
    Proxy.client = (client, secret)
    val port = if (args.drop(2).headOption.isDefined) args.head.toInt else 8888
    if (args.drop(3).headOption.isDefined) Proxy.server = url(args.drop(1).head)
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
