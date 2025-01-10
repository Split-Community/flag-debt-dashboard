const express = require('express');
const https = require('https');
const envVars = require('dotenv').config().parsed;
const {ownerMap, flagToOwnerMap} = require('./userGroupMap');

const ADMIN_API_KEY=envVars.ADMIN_API_KEY
const ORG_ID=envVars.ORG_ID
const app = express();
const port = process.env.PORT || 3000;


(async () => {
    const flagOwnerMap = await ownerMap(ADMIN_API_KEY);


    app.use(express.static('public')); // Serve static files from 'public' directory

app.get("/workspaces", (req, outRes) => {
    var options = {
      method: "GET",
      hostname: "api.split.io",
      path: "/internal/api/v2/workspaces?limit=100",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_API_KEY}`,
      },
      maxRedirects: 20,
    };
    var req = https.request(options, function (res) {
      var chunks = [];
  
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
  
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        var response = JSON.parse(body.toString());
        
        outRes.send(response.objects.map((workspace) => { return {'id': workspace.id, 'name': workspace.name}}));
      });
  
      res.on("error", function (error) {
        console.error(error);
      });
    });
    req.end();
  });

app.get("/envs", (req, outRes) => {
let workspace =  req.query.workspace;
var options = {
    method: "GET",
    hostname: "api.split.io",
    path: `/internal/api/v2/environments/ws/${workspace}`,
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_API_KEY}`,
    },
    maxRedirects: 20,
};
var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
    chunks.push(chunk);
    });

    res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    var response = JSON.parse(body.toString());
        
    outRes.send(response.map((env) => { return {'id': env.id, 'name': env.name}}));
    });

    res.on("error", function (error) {
    console.error(error);
    });
});
req.end();
});

  app.get("/splitDefs", (req, outRes) => {
    let workspace =  req.query.workspace;
    let offset =  req.query.offset;
    let env =  req.query.environment;
    var options = {
      method: "GET",
      hostname: "api.split.io",
      path: `/internal/api/v2/splits/ws/${workspace}/environments/${env}?offset=${offset}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_API_KEY}`,
      },
      maxRedirects: 20,
    };
     
    var req = https.request(options, async function (res) {
      var chunks = [];
      const map = await flagToOwnerMap(workspace, flagOwnerMap, ADMIN_API_KEY);
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });
  
      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        var output = JSON.parse(body.toString())
        var result = {};
        result.offset = output.offset;
        result.limit = output.limit;
        result.totalCount = output.totalCount
        result.flags = output.objects.map((split) => {
          return {
            name: split.name,
            id: split.id,
            owners: map.find((m) => m.name == split.name).owners,
            lastUpdateTime: new Date(split.lastUpdateTime),
            creationTime: new Date(split.creationTime),
            lastTrafficReceivedAt: new Date(split.lastTrafficReceivedAt),
            orgId: ORG_ID,
          };
        });
        outRes.send(result);
      });
  
      res.on("error", function (error) {
        console.error(error);
      });
    });
    req.end();
  });

app.listen(port, () => {
    console.log(`Feature Flags Dashboard running at http://localhost:${port}`);
});


})();


