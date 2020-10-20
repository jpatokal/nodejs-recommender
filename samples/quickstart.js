// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

'use strict';

/**
 * List usage recommendations for a given product.
 * @param {string} project
 * @param {string} recommenderName
 */
async function main(
  project = 'jani-gce-test',
  recommenderId = 'google.compute.instance.MachineTypeRecommender'
) {
  // [START recommender_quickstart]

  async function getZonesWithVMs() {
     const Compute = require('@google-cloud/compute');
     const compute = new Compute();
     return await compute.getVMs().then((vms) => {
      const zoneSet = new Set();
      for(const vm of vms[0]) {
        zoneSet.add(vm.zone.id);
      }
      return Array.from(zoneSet);
    });
  }

  async function listRecommendations(zones) {
    const {RecommenderClient} = require('@google-cloud/recommender');
    const recommender = new RecommenderClient();
    const recommendations = new Array();

    // parent = 'projects/my-project'; // Project to fetch recommendations for.
    // recommenderId = 'google.compute.instance.MachineTypeRecommender';

    for(const zone of zones) {
      const [zoneRecs] = await recommender.listRecommendations({
        parent: recommender.recommenderPath(project, zone, recommenderId),
      });
      console.info(`Recommendations from ${recommenderId} in zone ${zone}:`);
      for (const recommendation of recommendations) {
        for (const operationGroup of recommendation.content.operationGroups) {
          for (const operation of operationGroup.operations) {
            if(operation.action == "replace") {
              console.info(`Change instance ${operation.resource} to ${operation.value.stringValue}`);
            }
          }
        }
      }
      recommendations.push(...zoneRecs);
    }
    return recommendations;
  }
  const zones = await getZonesWithVMs();
  const recommendations = await listRecommendations(zones);
  // [END recommender_quickstart]
  return recommendations;
}

main(...process.argv.slice(2)).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
