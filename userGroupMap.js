// Description: This file contains the functions to get the mapping of flags to their owners (users and groups) and the mapping of users and groups.
async function ownerMap(apiKey) {
    let map = [];
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };
    
    let offset = 0;
    let hasMoreGroups = true;

    while (hasMoreGroups) {
      await fetch(`https://api.split.io/internal/api/v2/groups?limit=200&offset=${offset}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.objects.length > 0) {
            result.objects.forEach((group) => {
              map.push({ id: group.id, name: group.name, type: 'group' });
            });
            offset += 200;
          } else {
            hasMoreGroups = false;
          }
        })
        .catch((error) => {
          console.error(error);
          hasMoreGroups = false;
        });
    }


    let nextMarker = null;
    let hasMoreUsers = true;
    while (hasMoreUsers) {
      await fetch(`https://api.split.io/internal/api/v2/users?limit=200&nextMarker=${nextMarker}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.data.length > 0) {
            result.data.forEach((user) => {
              map.push({id:user.id, name:user.name, email: user.email, type: 'user'});
            });
            if(nextMarker !== null) {
              nextMarker = result.nextMarker;
            } else {
              hasMoreUsers = false;
            }
          } else {
            hasMoreUsers = false;
          }
        })
        .catch((error) => {
          console.error(error);
          hasMoreUsers = false;
        });
    }





return map;
    }

    async function flagToOwnerMap(ws, ownerMap, apiKey) {
      let map = [];
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${apiKey}`);
      
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };
      let offset = 0;
      let hasMoreFlags = true;

      while (hasMoreFlags) {
        await fetch(`https://api.split.io/internal/api/v2/splits/ws/${ws}?limit=50&offset=${offset}`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
        if (result.objects?.length > 0) {

          result.objects.forEach((flag) => {
            map.push({
          name: flag.name,
          owners: flag.owners.map(function (owner) {
            const ownerInfo = ownerMap.find(o => o.id === owner.id);
            return ownerInfo ? { id: ownerInfo.id, ownerName: ownerInfo.name, email: ownerInfo.type == 'user' ? ownerInfo.email : '', type: ownerInfo.type } : { ownerName: 'Unknown', type: 'Unknown' };
          })
            });
          });
          offset += 50;
        } else {
          hasMoreFlags = false;
        }
          })
          .catch((error) => {
        console.error(error);
        hasMoreFlags = false;
          });
      }
  
  return map;
      }




module.exports = { flagToOwnerMap, ownerMap };