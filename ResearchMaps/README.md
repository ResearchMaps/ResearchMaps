# ResearchMaps

ResearchMaps is a Node.js web application that uses a Neo4j graph database.

## Database for testing

A test database is included in the `neo4j-public/` directory. This database includes just one user object: the username is `researchmapsreviewer@gmail.com` and the password is `reviewresearchmaps`. These login credentials will allow you to sign in to the app.

To start the Neo4j server:

```
cd neo4j-public/bin
sudo ./neo4j start
```

When the server is ready, you will be able to access its web interface at `http://localhost:7474/`.

To stop the Neo4j server:

```
cd neo4j-public/bin
sudo ./neo4j stop
```


## Development environment setup

The Git repository for this project can be downloaded via https with the command

```
git clone https://github.com/ResearchMaps/ResearchMaps.git
```

or via ssh with the command

```
git clone git@github.com:ResearchMaps/ResearchMaps.git
```


To install this project, you first need to install:

1. python (2.6 or later)
  - http://www.python.org/download/

2. node.js and npm
  - http://nodejs.org/download/

3. graphviz
  - [http://www.graphviz.org/](http://www.graphviz.org/)
  - Mac: [http://www.graphviz.org/Download_macos.php](http://www.graphviz.org/Download_macos.php)
    - The mountainlion release (graphviz-2.36.0.pkg) works for Mavericks.

Make sure the graphviz /bin directory is in your PATH environment variable.
	
After installing npm, go to the project directory and type:

```
npm install
```

or

```
sudo npm install
```

**Note**: Whenever you run `npm install`, you must replace this file

```
ResearchMaps/web/node_modules/graphviz/lib/deps/graph.js
```

with this one:

```
ResearchMaps/deploy/files/after-npm/graph.js
```

If installation is successful, start the server by typing:

```
node index.js
```

Obtain a local copy of the Neo4j database. You may need to type

```
chmod +x ./bin/neo4j
```

from within this directory.


### Linux (Ubuntu 12.04.4 LTS)

After the above installation of python, node, and npm are complete, `cd` into the root directory of the project (ResearchMaps) and type

```
npm install
```

which will read the package.json file and install the necessary packages for node.

Try running the node server by typing

```
node index.js
```

from within the ResearchMaps directory. Node will report if any modules are missing—in which case you can install them using `npm install <module_name>`

Try running the Neo4j database by `cd`ing to Neo4j’s `/bin` directory and typing

```
sudo ./neo4j start
```

Ubuntu may give an error regarding your Java version, in which case following the instructions in the answer provided by the Community Wiki here:

[http://askubuntu.com/questions/56104/how-can-i-install-sun-oracles-proprietary-java-jdk-6-7-8-or-jre](http://askubuntu.com/questions/56104/how-can-i-install-sun-oracles-proprietary-java-jdk-6-7-8-or-jre)

If you need to add the JDK's /bin folder to your PATH variable, you can do so by adding a line to your `~/.bashrc` file. Here is an example of the syntax you can use:

```
export PATH="/usr/java/jdk1.8.0_05/bin":$PATH
```

From the [download page for graphviz](http://www.graphviz.org/Download_linux_ubuntu.php), download the following packages:

1. graphviz_2.38.0-1~precise_amd64.deb
2. libgraphviz-dev_2.38.0-1~precise_amd64.deb
3. libgraphviz4_2.38.0-1~precise_amd64.deb

Use the [dpkg](https://help.ubuntu.com/10.04/serverguide/dpkg.html) package manager to install the above `.deb` packages. An example of this command is

```
sudo dpkg -i libgraphviz4_2.38.0-1~precise_amd64.deb
```

You may get error messages when installing these packages that refer to existing packages being broken by the installation. If possible, you can remove any unnecessary packages (that are complaining about being broken by the installation) with the command

```
sudo apt-get remove <package_name>
```

You may also want to use the command

```
sudo apt-get -f install
```
or, alternatively,

```
sudo apt-get --fix-broken install
```

at various points throughout the installation of the graphviz packages. An explanation of the `-f`/`--fix-broken` flag is given in the man page for apt-get:

>-f, --fix-broken
>
>  Fix; attempt to correct a system with broken dependencies in place. This
>  option, when used with install/remove, can omit any packages to permit APT
>  to deduce a likely solution. If packages are specified, these have to
>  completely correct the problem. The option is sometimes necessary when
>  running APT for the first time; APT itself does not allow broken package
>  dependencies to exist on a system. It is possible that a system's dependency
>  structure can be so corrupt as to require manual intervention (which usually
>  means using dselect(1) or dpkg --remove to eliminate some of the offending
>  packages). Use of this option together with -m may produce an error in some
>  situations. Configuration Item: APT::Get::Fix-Broken.

If all of the dependencies have been installed correctly, you should be able to start the Neo4j server.

Similarly, if all of the dependencies have been installed correctly, you should be able to run the node server (from within the ResearchMaps directory) with the command

```
node index.js
```

## Debugging
To debug this Node.js application, first install node-inspector.

```
npm install -g node-inspector
```

Note that including the `-g` flag will install node-inspector globally on your machine.

Then, to debug the application, use this command:

```
node-debug index.js
```

Alternatively, you can use the built-in debugger in [Webstorm](https://www.jetbrains.com/webstorm/), which can communicate with Chrome via the [JetBrains IDE Support](https://chrome.google.com/webstore/detail/jetbrains-ide-support/hmhgeddbohgjknpmjagkdomcpobmllji?hl=en) extension.


## Documentation

Documentation is generated using [YUIDoc](http://yui.github.io/yuidoc/). The documentation is rendered as `html`
that can be viewed in the browser.

The documentation files are in the `./out` directory.

### Generating the documentation

To regenerate the documentation files from the source code, first install YUIDoc.

```
npm -g install yuidocjs
```

Then, from the root of the repository, run

```
yuidoc .
```
