import React from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import HomeScreen from "../screens/HomeScreen";
import GameScreen from "../screens/GameScreen";

export default () => (
  <Router>
    <Switch>
      <Route path="/" exact component={HomeScreen} />
      <Route path="/game/:id" exact component={GameScreen} />
    </Switch>
  </Router>
);
