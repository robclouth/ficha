import { Link, Theme, Typography, withStyles } from "@material-ui/core";
import Markdown from "markdown-to-jsx";
import { observer } from "mobx-react";
import React from "react";

const styles = (theme: Theme) => ({
  listItem: {
    marginTop: theme.spacing(1)
  }
});

const options = {
  overrides: {
    h1: {
      component: Typography,
      props: {
        gutterBottom: true,
        variant: "h5"
      }
    },
    h2: { component: Typography, props: { gutterBottom: true, variant: "h6" } },
    h3: {
      component: Typography,
      props: { gutterBottom: true, variant: "subtitle1" }
    },
    h4: {
      component: Typography,
      props: { gutterBottom: true, variant: "caption", paragraph: true }
    },
    p: { component: Typography, props: { paragraph: true } },
    a: { component: Link },
    li: {
      //@ts-ignore
      component: withStyles(styles)(({ classes, ...props }) => (
        <li className={classes.listItem}>
          <Typography component="span" {...props} />
        </li>
      ))
    }
  }
};

export default observer(({ markdown }: { markdown: string }) => {
  return <Markdown options={options} children={markdown} />;
});
