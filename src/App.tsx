import { Box } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import CssBaseline from "@material-ui/core/CssBaseline";
import {
  createMuiTheme,
  makeStyles,
  ThemeProvider
} from "@material-ui/core/styles";
import { observer } from "mobx-react";
import { SnackbarProvider } from "notistack";
import React, { useEffect } from "react";
import Navigator from "./components/Navigator";
import { useStore } from "./stores/RootStore";
import "./i18n";

const useStyles = makeStyles(theme => ({
  root: {
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  "@global": {
    "*::-webkit-scrollbar": {
      height: 6,
      width: 6
    },
    "*::-webkit-scrollbar-track": {
      backgroundColor: "transparent"
    },
    "*::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.grey[500],
      borderRadius: 3
    },
    scrollbarWidth: "thin",
    scrollbarColor: "transparent " + theme.palette.grey[500]
  }
}));

const darkTheme = createMuiTheme({
  palette: {
    type: "dark"
  }
});

export default observer(() => {
  const rootStore = useStore();
  const { uiState } = rootStore;

  useEffect(() => {
    rootStore.init();
  }, [rootStore]);

  useEffect(() => {
    document.addEventListener("keydown", e => uiState.handleKeyPress(e));
  }, []);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <SnackbarProvider autoHideDuration={3000} maxSnack={3}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          {rootStore.isInitialized ? <Navigator /> : <CircularProgress />}
        </ThemeProvider>
      </SnackbarProvider>
    </div>
  );
});
