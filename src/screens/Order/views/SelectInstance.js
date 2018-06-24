import React, { Component } from "react";
import {
  Text,
  View,
  Button,
  Icon,
  Content,
  List,
  ListItem,
  Spinner
} from "native-base";
import { Col, Row, Grid } from "react-native-easy-grid";
import { connect } from "react-redux";
import hash from "object-hash";

import { actionCreators } from "../../../allianceRedux";
import InstanceRow from "../components/InstanceRow";
import ItemRow from "../components/ItemRow";
import RButton from "../../../components/RButton";

import styles from "../../../styles";
import colours from "../../../colours";
const myStyle = {
  item: {
    ...styles.item,
    paddingTop: 5,
    paddingBottom: 5
  },
  htext: {
    fontSize: 12,
    color: colours.gold
  },
  h1: {
    fontWeight: "bold",
    color: colours.gold
  },
  br: {
    height: 20
  },
  between: {
    justifyContent: "space-between"
  },
  wtext: {
    fontSize: 14,
    color: colours.white
  },
  bottom: {
    height: 85,
    margin: 10,
    backgroundColor: "transparent"
  },
  avgText: {
    fontSize: 12,
    color: colours.white
  },
  moreButton: {
    backgroundColor: colours.gold
  }
};

class SelectInstance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedId: null,
      showAll: false
    };
  }

  componentWillReceiveProps({ items: nextItems }) {
    if (Object.keys(nextItems).length === 0)
      this.setState({ selectedId: null });
  }

  canRenderMoreButton = () => {
    const { showAll } = this.state;
    if (showAll) return false;
    const { items: itemResult } = this.props;
    if (!itemResult) return false;
    const { instances, items } = itemResult;
    if (instances && instances.length > 3 || items && items.length > 3) return true;
    return false;
  };

  handleSelection = selectedId => this.setState({ selectedId });

  getOrder = () => {
    const { dispatch, goToTab } = this.props;
    const { selectedId } = this.state;
    dispatch(actionCreators.getOrder(selectedId));
    goToTab(3);
  };

  render() {
    let itemList = null;
    let instanceList = null;
    let loading = null;
    const {
      goToTab,
      items: itemResult,
      isFetching,
      companySettings: { MobileClientMode },
      companySettings
    } = this.props;
    const clientModeIsntBasic = (__DEV__) ? true : MobileClientMode !== "Basic";

    const { selectedId, showAll } = this.state;
    if (itemResult && (itemResult.instances !== undefined || itemResult.items !== undefined)) {
      const { hireType, instances, items } = itemResult;
      loading = null;
      if (instances && instances.length) {
        instanceList = instances.filter((i, idx) => (showAll || idx < 3)).map(i => {
          const itemHash = `instance:${i.InstanceId}`;
          return (
            <InstanceRow
              key={itemHash}
              object={i}
              handleSelect={() => this.handleSelection(itemHash)}
              selected={selectedId === itemHash}
              companySettings={companySettings}
              hireType={hireType}
            />
          );
        });
      } else {
        instanceList = (
          <ListItem style={styles.item}>
            <Text style={myStyle.avgText}>
              There are no company or related assets of this type available for this search
            </Text>
          </ListItem>
        );
      }
      if (items && items.length) {
        itemList = items.filter((i, idx) => (showAll || idx < 3)).map(i => {
          const itemHash = `${i.SupplierCompanyId}:${i.ItemId}`;
          return (
            <ItemRow
              key={itemHash}
              object={i}
              handleSelect={() => this.handleSelection(itemHash)}
              selected={selectedId === itemHash}
              companySettings={companySettings}
              hireType={hireType}
            />
          );
        });
      } else {
        itemList = (
          <ListItem style={styles.item}>
            <Text style={myStyle.avgText}>
              There are no suppliers with assets of this type available for this search
            </Text>
          </ListItem>
        );
      }
    } else {
      loading = <Spinner color="white" />;
    }

    const instanceRender = (
      <View>
        <Text style={myStyle.h1}>Company Assets Available</Text>
        <Text style={myStyle.wtext}>
          Below are internal assets matching your search.
        </Text>
        <List>
          <ListItem style={myStyle.item}>
            <Grid style={myStyle.between}>
              <Col>
                <Text style={myStyle.htext}>Owner</Text>
              </Col>
              <Col>
                <Text style={myStyle.htext}>Details</Text>
              </Col>
              <Col>
                <Text style={myStyle.htext}>Rate</Text>
              </Col>
              <Col>
                <Text style={myStyle.htext}>Location</Text>
              </Col>
            </Grid>
          </ListItem>
          {instanceList}
          {loading}
        </List>
        <View style={myStyle.br} />
      </View>
    );

    const renderMoreButton = !this.canRenderMoreButton() ? null :
      <Button transparent full onPress={() => this.setState({ showAll: true })}>
        <Text style={myStyle.h1}>Load more results</Text>
      </Button>;

    return (
      <Grid style={styles.blue} >
        <Row>
          <Content style={styles.content}>
            {clientModeIsntBasic && instanceRender}
            <Text style={myStyle.h1}>Hire Supplier Assets Available</Text>
            <Text style={myStyle.wtext}>
              Below are external assets matching your search.
            </Text>
            <List>
              <ListItem style={myStyle.item}>
                <Grid style={myStyle.between}>
                  <Col>
                    <Text style={myStyle.htext}>Supplier</Text>
                  </Col>
                  <Col>
                    <Text style={myStyle.htext}>Rating</Text>
                  </Col>
                  <Col>
                    <Text style={myStyle.htext}>Rate</Text>
                  </Col>
                  <Col>
                    <Text style={myStyle.htext}>Location</Text>
                  </Col>
                </Grid>
              </ListItem>
              {itemList}
              {loading}
              {renderMoreButton}
            </List>
          </Content>
        </Row>
        <Row style={myStyle.bottom}>
          <Col
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "row"
            }}
          >
            <View style={{ position: "absolute", bottom: 0, left: 20 }}>
              <RButton onPress={() => goToTab(1)} />
            </View>
            <RButton
              large
              disabled={!selectedId}
              onPress={() => this.getOrder()}
            />
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  items: state.items,
  isFetching: state.isFetching,
  companySettings: state.companySettings
});

export default connect(mapStateToProps)(SelectInstance);
