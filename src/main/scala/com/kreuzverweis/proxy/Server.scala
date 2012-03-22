/**
 *
 * Copyright 2012 Kreuzverweis Solutions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/** embedded server */
package com.kreuzverweis.proxy

import java.io.File
import dispatch.url
import com.typesafe.config.ConfigFactory
import com.typesafe.config.Config

object Server {
  val logger = org.clapper.avsl.Logger(Server.getClass)
  val http = new dispatch.nio.Http

  def main(args: Array[String]) {
    val default = ConfigFactory.load()
    val config = args.headOption match {
      case Some(fileName) => ConfigFactory.parseFile(new File(fileName)).withFallback(default)
      case None => default
    }

    val client = config.getString("sk4web.client")
    val secret = config.getString("sk4web.secret")
    Proxy.client = (client, secret)
    val port = config.getInt("sk4web.port")
    Proxy.backoffice = url(config.getString("sk4web.backoffice"))
    Proxy.keywording = url(config.getString("sk4web.keywording"))
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
