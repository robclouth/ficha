import React from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import Home from "../screens/Home";
import Game from "../screens/Game";

export default () => (
  <Router>
    <Switch>
      <Route path="/" exact component={Home} />
      <Route path="/game/:id?" component={Game} />
    </Switch>
  </Router>
);
