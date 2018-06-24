import Sentry from "sentry-expo";

import logger from "../logger";
import Tree from "./tree";

// const API_BASE = "http://danewilson.me";
const API_BASE = "http://api2.alliancehire.com";
const SEARCH = API_BASE + "/search";
const LOGIN = API_BASE + "/user/login";
const GET_USER = API_BASE + "/user/details";
const USER_COMPANIES = API_BASE + "/user/companies";
const COMPANY_DETAILS = API_BASE + "/user/company";
const WORK_HOUR_RANGE = API_BASE + "/globalVariables/workHoursRange";
const GET_TREE = SEARCH + "/tree";
const GET_ITEM_DETAILS = SEARCH + "/itemDescription";
const BILLABLES = SEARCH + "/billableDays";
const ITEM_SEARCH = SEARCH + "/itemInstanceSearch";
const INSTACE_CONTACTS = SEARCH + "/instanceContactDetails";
const SUPPLIER_CONTACTS = SEARCH + "/itemContactDetails";
const SUPPLIER_CITIES = SEARCH + "/itemContactCities";
const ITEM_LEAD_HOURS = SEARCH + "/addWorkHours";
const HIRE_TYPE_OPTIONS = SEARCH + "/hireTypeOptions";

class AllianceApi {
  constructor() {
    this.authToken = null;
    this.user = null;
    this.itemId = null;
    this.companyid = null;
    this.companySettings = null;
    this.userCompanies = null;
    this.itemCache = null;
  }
  isAuthenticated() {
    return this.authToken !== null;
  }
  setAuthToken(authToken) {
    this.authToken = authToken;
    return this;
  }
  getAuthToken() {
    return this.authToken;
  }
  setUser(user) {
    this.user = user;
    Sentry.setUserContext({
      email: user.email,
      id: user.userId
    });
    return this;
  }
  getUser() {
    return this.user;
  }
  setItemId(id) {
    this.itemId = id;
    return this;
  }
  getItemId() {
    return this.itemId;
  }
  setCompanyId(companyid) {
    this.companyid = companyid;
    return this;
  }
  getCompanyId() {
    return this.companyid;
  }
  setCompanySettings(companySettings) {
    this.companySettings = companySettings;
    return this;
  }
  getCompanySettings() {
    return this.companySettings;
  }
  setUserCompanies(userCompanies) {
    this.userCompanies = userCompanies;
    return this;
  }
  getUserCompanies() {
    return this.userCompanies;
  }
  setItemCache(supplierId, itemId) {
    this.itemCache = { supplierId, itemId };
    return this;
  }
  getItemCache() {
    return this.itemCache;
  }
}

const apiSingleton = new AllianceApi();

const getData = async response => {
  if (response.status == 401) {
    // this will do...
    return { auth_failed: true };
  }
  return await response.json();
};

const login = (username, password) => {
  return new Promise(async (resolve, reject) => {
    if (!username.trim().length || !password.trim().length)
      return reject("You need to enter your username and password");
    const loginData = `grant_type=password&username=${username}&password=${password}`;
    try {
      let response = await fetch(LOGIN, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        mode: "cors",
        body: loginData
      });
      let data = await response.json();
      if (data.error) return reject(data.error);
      const accessToken = data.access_token;
      response = await fetch(GET_USER, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      });
      data = await response.json();
      if (data.Message) return reject(data.Message);
      apiSingleton
        .setAuthToken(accessToken)
        .setUser(data)
        .setCompanyId(data.defaultCompanyId)
        .setCompanySettings(await getCompanyDetails())
        .setUserCompanies(await getUserCompanies());
      return resolve({
        ...data,
        auth_token: accessToken
      });
    } catch (err) {
      return reject(err);
    }
  });
};

const getUserCompanies = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(USER_COMPANIES, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getCompanyList = () => apiSingleton.getUserCompanies();

const getCompanyDetails = () => {
  const { defaultSourceCompanyId } = apiSingleton.getUser();
  const companyId = apiSingleton.getCompanyId();
  const uri = `${COMPANY_DETAILS}?companyId=${companyId}&sourceCompanyId=${defaultSourceCompanyId}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getWorkHours = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(WORK_HOUR_RANGE, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getBillables = (startDate, endDate) => {
  const uri = `${BILLABLES}?startDate=${startDate.valueOf()}&endDate=${endDate.valueOf()}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve({ ...data, startDate, endDate });
    } catch (err) {
      return reject(null);
    }
  });
};

const getHireTypeOptions = (itemId) => {
  const { defaultSourceCompanyId: scid } = apiSingleton.getUser();
  const cid = apiSingleton.getCompanyId();
  const uri = `${HIRE_TYPE_OPTIONS}?companyId=${cid}&sourceCompanyId=${scid}&itemId=${itemId}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getItems = (billableDays, hireType) => {
  const user = apiSingleton.getUser();
  const itemId = apiSingleton.getItemId();
  const uri = `${ITEM_SEARCH}?itemId=${itemId}&companyId=${user.defaultCompanyId}&sourceCompanyId=${user.defaultSourceCompanyId}&billableDays=${billableDays}&hireTypeOption=${hireType}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      // why the fuck is there wet or dry data in here when the hireType is included in the search... ill just pass it back so i can manually sort this..
      // should have any API logic in this layer
      if (typeof data === "string") {
        // TODO: For some reason this now returns "An unexpected error has occurred. The System Administrator hsa been notified."
        // Booking single day on the Tues 30 Jan 2018 9am - 5pm
        console.error(data);
        return reject(null);
      }
      return resolve({ ...data, hireType });
    } catch (err) {
      console.error(err);
      return reject(null);
    }
  });
};

const getItemTree = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(GET_TREE, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      const itemTree = new Tree();
      itemTree.build(data);
      return resolve(itemTree);
    } catch (err) {
      return reject(null);
    }
  });
};

const getItemDetails = id => {
  apiSingleton.setItemId(id);
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${GET_ITEM_DETAILS}?itemId=${id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getLeadTime = itemBaseHours => {
  // DeliveryLeadTimeHours or PickupLeadTimeHours as input
  const uri = `${ITEM_LEAD_HOURS}?hours=${itemBaseHours}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      if (data && data.time) {
        return resolve(data.time);
      }
      return reject("Query failed");
    } catch (err) {
      return reject("Query failed");
    }
  });
};

const getOrder = async (selectedId, cityId = null) => {
  const parts = selectedId.split(":");
  if (parts[0] === "instance") {
    return getInstanceContactDetails(parts[1]);
  } else {
    const { cityId: defaultCityId } = apiSingleton
      .setItemCache(parts[0], parts[1])
      .getUser();
    if (cityId) {
      return getSupplierContactDetails(cityId, parts[1], parts[0]);
    }
    return getSupplierContactDetails(defaultCityId, parts[1], parts[0]);
  }
};

const updateOrder = async cityId => {
  const { supplierId, itemId } = apiSingleton.getItemCache();
  updateUser({ cityId });
  return getSupplierContactDetails(cityId, itemId, supplierId);
};

const getInstanceContactDetails = instanceId => {
  const uri = `${INSTACE_CONTACTS}?instanceId=${instanceId}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getSupplierContactDetails = (cityId, itemId, supplierId) => {
  const uri = `${SUPPLIER_CONTACTS}?itemId=${itemId}&supplierId=${supplierId}&cityId=${cityId}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};

const getSupplierCities = selectedId => {
  let supplierId = null;
  let itemId = null;
  if (selectedId === null) {
    const itemCache = apiSingleton.getItemCache();
    if (!itemCache) return [];
    supplierId = itemCache.supplierId;
    itemId = itemCache.itemId;
  } else {
    const parts = selectedId.split(":");
    supplierId = parts[0];
    itemId = parts[1];
  }
  const uri = `${SUPPLIER_CITIES}?itemId=${itemId}&supplierId=${supplierId}`;
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSingleton.getAuthToken()}`
        }
      });
      const data = await getData(response);
      return resolve(data);
    } catch (err) {
      return reject(null);
    }
  });
};
const updateUser = (updateFields, saveOnServer = false) => {
  const user = apiSingleton.getUser();
  const updatedUser = { ...user, ...updateFields };
  if (saveOnServer) {
    //TODO: save the user on the server side too
  }
  apiSingleton.setUser(updatedUser);
  return updatedUser;
};
const changeCompany = async (cId, setDefault = false) => {
  // TODO: make it set the default company
  apiSingleton
    .setCompanyId(cId)
    .setCompanySettings(await getCompanyDetails());
  return updateUser({ defaultCompanyId: cId, defaultSourceCompanyId: cId }, setDefault);
};

export default {
  login,
  getItemTree,
  getItemDetails,
  getWorkHours,
  getBillables,
  getHireTypeOptions,
  getItems,
  getCompanyDetails,
  apiSingleton,
  getOrder,
  getLeadTime,
  getCompanyList,
  getUserCompanies: getCompanyList,
  getSupplierCities,
  updateOrder,
  updateUser,
  changeCompany,
};
