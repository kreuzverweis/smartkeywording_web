import com.typesafe.startscript.StartScriptPlugin

organization := "com.kreuzverweis"

name := "Kreuzverweis Keywording"

version := "0.1.0-SNAPSHOT"

libraryDependencies ++= Seq(
   "net.databinder" %% "unfiltered-netty-server" % "0.5.1",
   "net.databinder" %% "dispatch-nio" % "0.8.5",
   "net.databinder" %% "dispatch-oauth" % "0.8.5",
   "org.clapper" %% "avsl" % "0.3.6",
   "net.databinder" %% "unfiltered-spec" % "0.5.1" % "test"
)

resolvers ++= Seq(
  "jboss repo" at "http://repository.jboss.org/nexus/content/groups/public-jboss/"
)

seq(StartScriptPlugin.startScriptForClassesSettings: _*)

