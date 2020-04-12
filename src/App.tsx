import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import CircularProgress from "@material-ui/core/CircularProgress";

import Navigator from "./components/Navigator";
import { useStore } from "./stores/RootStore";
import { observer } from "mobx-react";

const useStyles = makeStyles(theme => ({
  root: {
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
}));

export default observer(() => {
  const classes = useStyles();
  const rootStore = useStore();

  React.useEffect(() => {
    rootStore.init();
  }, [rootStore]);

  return (
    <div className={classes.root}>
      <CssBaseline />
      {rootStore.isInitialized ? <Navigator /> : <CircularProgress />}
    </div>
  );
});
