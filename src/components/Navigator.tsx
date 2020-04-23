import React from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import GameScreen from "../screens/GameScreen";

export default () => (
  <Router>
    <Switch>
      <Route path="/:game?" component={GameScreen} />
    </Switch>
  </Router>
);
