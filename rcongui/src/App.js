import React, { Component } from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PlayerView from "./components/PlayerView";
import useStyles from "./components/useStyles";
import Grid from "@material-ui/core/Grid";
import Logs from "./components/LogsView/logs";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Link from "@material-ui/core/Link";
import CssBaseline from "@material-ui/core/CssBaseline";
import HLLSettings from "./components/SettingsView/hllSettings";
import { ThemeProvider } from '@material-ui/styles';
import {
  HashRouter as Router,
  Switch,
  Route,
  Link as RouterLink
} from "react-router-dom";
import { createMuiTheme } from '@material-ui/core/styles';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Brightness4OutlinedIcon from '@material-ui/icons/Brightness4Outlined';

function rgba2hex(orig) {
  var a, isPercent,
    rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
    alpha = (rgb && rgb[4] || "").trim(),
    hex = rgb ?
      (rgb[1] | 1 << 8).toString(16).slice(1) +
      (rgb[2] | 1 << 8).toString(16).slice(1) +
      (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

  if (alpha !== "") {
    a = alpha;
  } else {
    a = "01";
  }
  // multiply before convert to HEX
  a = ((a * 255) | 1 << 8).toString(16).slice(1)
  hex = hex + a;

  return hex;
}

class BattleMetrics extends React.Component {
  componentDidMount() {
    window.addEventListener(
      'message',
      function (e) {
        if (e.data.uid && e.data.type === 'sizeUpdate') {
          var i = document.querySelector('iframe[name="' + e.data.uid + '"]');
          i.style.width = e.data.payload.width; i.style.height = e.data.payload.height;
        }
      });

  }

  render() {
    const { classes, serverId, theme } = this.props;
    window.theme = theme
    return (
      serverId ?
        <iframe style={{ border: 0 }
        }
          src={`https://cdn.battlemetrics.com/b/horizontal500x80px/${serverId}.html?foreground=%23${theme.palette.primary.contrastText.replace('#', '')}&background=%23${theme.palette.primary.main.replace('#', '')}&lines=%23${theme.palette.primary.contrastText.replace('#', '')}&linkColor=%23${theme.palette.secondary.contrastText.replace('#', '')}&chartColor=%23${theme.palette.error.light.replace('#', '')}`
          }
          frameborder={0} name="cervz" ></iframe>
        : ''
    )
  }
}

const Live = ({ classes }) => (
  <Grid container spacing={1}>
    <Grid item sm={12} md={6}>
      <PlayerView classes={classes} />
    </Grid>
    <Grid item sm={12} md={6}>
      <Logs classes={classes} />
    </Grid>
  </Grid>
);


const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

const lightTheme = createMuiTheme({
  palette: {
    type: 'light',
  },
});


function App() {
  const classes = useStyles();
  const [dark, setDark] = React.useState(false)
  const theme = dark ? darkTheme : lightTheme
  console.log(theme.palette)
  return (
    <div className={"App " + classes.root}>
      <ThemeProvider theme={theme} >
        <CssBaseline />
        <ToastContainer />
        <Router>
          <Grid container className={classes.grow}>
            <div className={classes.grow}>
              <AppBar position="static" elevation={0} className={classes.appBar}>
                <Toolbar className={classes.toolbar}>

                  <nav className={classes.title}>
                    <Link
                      variant="button"
                      color="inherit"
                      className={classes.firstLink}
                      component={RouterLink}
                      to="/"
                    >
                      Live
                  </Link>

                    <Link
                      variant="button"
                      color="inherit"
                      className={classes.link}
                      component={RouterLink}
                      to="/settings"
                    >
                      Settings
                  </Link>
                    <Checkbox icon={<Brightness4Icon />} checkedIcon={<Brightness4OutlinedIcon />} checked={dark ? true : false} color="default" onChange={(e, val) => setDark(val)} />
                  </nav>

                  <div className={classes.battleMetrics}>
                    <BattleMetrics
                      classes={classes}
                      theme={theme}
                      serverId={process.env.REACT_APP_BATTLEMETRICS_SERVERID}
                    />
                  </div>
                </Toolbar>
              </AppBar>
            </div>
          </Grid>
          <Switch>
            <Route path="/" exact>
              <Live classes={classes} />
            </Route>
            <Route path="/settings">
              <Grid container>
                <Grid item sm={12} lg={6}>
                  <HLLSettings classes={classes} />
                </Grid>
              </Grid>
            </Route>
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
