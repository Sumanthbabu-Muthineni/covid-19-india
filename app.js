const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Data base error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const stateTableConversion = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};

//api list of all states
app.get("/states/", async (request, response) => {
  const getStateListQuery = `select * from state;`;
  const getStateListQueryResponse = await db.all(getStateListQuery);
  response.send(
    getStateListQueryResponse.map((eachState) =>
      stateTableConversion(eachState)
    )
  );
});
// api 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `select * from state where state_id=${stateId}`;
  const stateIdQueryResponse = await db.get(stateIdQuery);
  response.send(stateTableConversion(stateIdQueryResponse));
});
// api 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistrictQuery = `insert into district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  insertQueryResponse = await db.run(insertDistrictQuery);
  response.send("District Successfully Added");
});
// api 4
const convertDbObjectAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `select * from district where district_id=${districtId};`;
  const getDistrictByIdQueryResponse = await db.get(getDistrictByIdQuery);
  response.send(convertDbObjectAPI4(getDistrictByIdQueryResponse));
});

//api 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `delete from district where district_id=${districtId};`;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//api 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;

  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//api 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await db.get(getStateByIDStatsQuery);
  response.send(getStateByIDStatsQueryResponse);
});
//api 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
