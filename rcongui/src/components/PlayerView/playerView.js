import React, { Component } from "react";
import _ from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { postData, showResponse, get, handle_http_errors } from "../../utils/fetchUtils";
import AutoRefreshBar from "./header";
import TextInputBar from "./textInputBar";
import CompactList from "./playerList";
import { ReasonDialog } from "./playerActions";
import GroupActions from "./groupActions";
import Unban from "./unban";
import { Map, fromJS } from 'immutable'

function stripDiacritics(string) {
  return typeof string.normalize !== 'undefined'
    ? string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : string;
}

class PlayerView extends Component {
  constructor(props) {
    super();
    this.state = {
      selectedPlayers: [],
      bannedPlayers: null,
      players: [],
      filteredPlayerNames: [],
      filteredPlayerSteamIDs: [],
      filteredPlayerProfiles: [],
      filter: "",
      filterTimeout: null,
      actionMessage: "",
      doConfirm: false,
      alphaSort: false,
      openGroupAction: false,
      openUnban: false
    };

    this.onPlayerSelected = this.onPlayerSelected.bind(this);
    this.filterPlayers = this.filterPlayers.bind(this);
    this.filterChange = this.filterChange.bind(this);
    this.loadPlayers = this.loadPlayers.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.loadBans = this.loadBans.bind(this);
    this.unBan = this.unBan.bind(this);
  }

  unBan(ban) {
    postData(`${process.env.REACT_APP_API_URL}do_remove_${ban.type}_ban`, {
      ban_log: ban.raw
    })
      .then(response =>
        showResponse(
          response,
          `Remove ${ban.type} ban for ${ban.name}`,
          true
        )
      )
      .then(this.loadBans)
      .catch(handle_http_errors)
  }

  handleAction(actionType, player, message = null) {
    if (message === null) {
      message = this.state.actionMessage;
    }
    if (message === "" && !actionType.startsWith("switch_")) {
      this.setState({ doConfirm: { player: player, actionType: actionType } });
    } else {
      postData(`${process.env.REACT_APP_API_URL}do_${actionType}`, {
        player: player,
        reason: message
      })
        .then(response =>
          showResponse(response, `${actionType} ${player}`, true)
        )
        .then(this.loadPlayers)
        .catch(handle_http_errors)
    }
  }

  onPlayerSelected(players) {
    this.setState({ selectedPlayers: players });
  }

  async load(command, callback) {
    return get(command)
      .then(response => showResponse(response, command))
      .then(data => callback(data))
      .catch(handle_http_errors);
  }

  loadPlayers() {
    return this.load("get_players", data => {
      this.setState(
        { players: data.result === null ? [] : data.result },
        () => {
          this.filterPlayers();
        }
      );
      return data;
    });
  }

  loadBans() {
    return this.load("get_bans", data =>
      this.setState({ bannedPlayers: data.result })
    );
  }

  componentDidMount() {
    this.loadPlayers();
  }

  filterChange(filter) {
    clearTimeout(this.state.filterTimeout); // switch to lodash debounce
    this.setState({
      filter: filter,
      filterTimeout: setTimeout(this.filterPlayers, 200)
    });
  }

  filterPlayers() {
    // TODO this is shit. The point was to prevent uncessary refreshes to save perf
    // But we could just switch to immutables for that
    const { filter, players } = this.state;
    if (!filter) {
      const filteredPlayerNames = players.map(p => p.name);
      const filteredPlayerSteamIDs = players.map(p => p.steam_id_64);
      const filteredPlayerProfiles = players.map(p => fromJS(p.profile || {}));
      return this.setState({ filteredPlayerSteamIDs, filteredPlayerNames, filteredPlayerProfiles });
    }
    const filteredPlayers = _.filter(
      players,
      p => stripDiacritics(p.name).toLowerCase().indexOf(filter.toLowerCase()) >= 0
    );

    const filteredPlayerNames = filteredPlayers.map(p => p.name);
    const filteredPlayerSteamIDs = filteredPlayers.map(p => p.steam_id_64);
    const filteredPlayerProfiles = filteredPlayers.map(p => fromJS(p.profile || {}))
    this.setState({ filteredPlayerNames, filteredPlayerSteamIDs, filteredPlayerProfiles });
  }

  render() {
    const { classes } = this.props;
    const {
      openGroupAction,
      openUnban,
      players,
      filteredPlayerNames,
      filteredPlayerSteamIDs,
      filteredPlayerProfiles,
      actionMessage,
      doConfirm,
      alphaSort,
      bannedPlayers
    } = this.state;

    return (
      <React.Fragment>
        <AutoRefreshBar
          intervalFunction={this.loadPlayers}
          everyMs={15000}
          refreshIntevalMs={100}
          onGroupActionClick={() => this.setState({ openGroupAction: true })}
          onUnbanClick={() => {
            this.loadBans();
            this.setState({ openUnban: true });
        }}
        />
        <TextInputBar
          classes={classes}
          handleChange={this.filterChange}
          total={players.length}
          showCount={filteredPlayerNames.length}
          handleMessageChange={text => this.setState({ actionMessage: text })}
          actionMessage={actionMessage}
          handleToggleAlphaSort={bool => this.setState({ alphaSort: bool })}
        />

        {players ? (
          <CompactList
            classes={classes}
            alphaSort={alphaSort}
            playerNames={filteredPlayerNames}
            playerSteamIDs={filteredPlayerSteamIDs}
            playerProfiles={filteredPlayerProfiles}
            handleAction={(actionType, player) =>
              this.handleAction(actionType, player)
            }
            handleToggle={() => 1}
          />
        ) : (
          <p>"No players to show"</p>
        )}
        <GroupActions
          onClose={() => this.setState({ openGroupAction: false })}
          open={openGroupAction}
          classes={classes}
          players={players}
          handleAction={this.handleAction}
        />
        <Unban
          open={openUnban}
          onReload={this.loadBans}
          handleUnban={this.unBan}
          bannedPlayers={bannedPlayers}
          classes={classes}
          onClose={() => this.setState({ openUnban: false })}
        />
        <ReasonDialog
          open={doConfirm}
          handleClose={() => this.setState({ doConfirm: false })}
          handleConfirm={(action, player, reason) => {
            this.handleAction(action, player, reason);
            this.setState({ doConfirm: false });
          }}
        />
      </React.Fragment>
    );
  }
}

export default PlayerView;
