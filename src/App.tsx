import React, { useEffect } from "react";
import {
  makeStyles,
  ThemeProvider,
  createMuiTheme,
  Theme,
  withStyles
} from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import CircularProgress from "@material-ui/core/CircularProgress";
import { SnackbarProvider } from "notistack";

import Navigator from "./components/Navigator";
import { useStore } from "./stores/RootStore";
import { observer } from "mobx-react";
import { Box } from "@material-ui/core";

const globalStyles = (theme: Theme) => ({
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
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
});

const StyledBox = withStyles(globalStyles as any)(Box);

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

  return (
    <StyledBox>
      <SnackbarProvider autoHideDuration={3000} maxSnack={3}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          {rootStore.isInitialized ? <Navigator /> : <CircularProgress />}
        </ThemeProvider>
      </SnackbarProvider>
    </StyledBox>
  );
});
