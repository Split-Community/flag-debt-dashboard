document.addEventListener('DOMContentLoaded', function() {
    fetchWorkspaces();

    document.getElementById('workspaceSelect').addEventListener('change', function() {
        const workspaceId = this.value;
        if (workspaceId) {
            fetchEnvironments(workspaceId);
        } else {
            document.getElementById('environmentSelect').innerHTML = '<option value="">Select Environment</option>';
        }
    });

    document.getElementById('loadFlags').addEventListener('click', function() {
        const workspaceId = document.getElementById('workspaceSelect').value;
        const environmentId = document.getElementById('environmentSelect').value;
        if (workspaceId && environmentId) {
            fetchFeatureFlags(workspaceId, environmentId);
        } else {
            alert('Please select both a workspace and an environment.');
        }
    });
});

function fetchWorkspaces() {
    // Clear existing options
    const workspaceSelect = document.getElementById('workspaceSelect');

    // Fetch environments based on the workspaceId
    fetch(`/workspaces`)
        .then(response => response.json())
        .then(workspaces => {
            workspaces.forEach(workspace => {
                const option = document.createElement('option');
                option.value = workspace.id;
                option.textContent = workspace.name;
                workspaceSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching workspaces:', error));
}


function fetchEnvironments(workspaceId) {
    // Clear existing options
    const environmentSelect = document.getElementById('environmentSelect');
    environmentSelect.innerHTML = '<option value="">Select Environment</option>';

    // Fetch environments based on the workspaceId
    fetch(`/envs?workspace=${workspaceId}`)
        .then(response => response.json())
        .then(environments => {
            environments.forEach(environment => {
                const option = document.createElement('option');
                option.value = environment.id;
                option.textContent = environment.name;
                environmentSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching environments:', error));
}

function fetchFeatureFlags(workspaceId, environmentId) {
    let offset = 0;
    const limit = 20; // Batch size
    const featureFlags = []; // To store concatenated results

    function fetchBatch() {
        fetch(`/splitDefs?workspace=${workspaceId}&environment=${environmentId}&offset=${offset}`)
        .then(response => response.json())
        .then(data => {
            // Concatenate the new batch of flags to the main array
            featureFlags.push(...data.flags); // Assuming the flags are returned in an array named 'data'
            updateTable(featureFlags, workspaceId); // Update the table with the current batch of flags

            const totalCount = data.totalCount; // Assuming the total count is returned as 'totalCount'
            if (featureFlags.length < totalCount) {
                // If we haven't fetched all flags, adjust the offset and fetch the next batch
                offset += limit;
                fetchBatch();
            }
        })
        .catch(error => console.error('Error fetching feature flags:', error));
}

    fetchBatch();
}

function formatFlagOwners(flagOwners, orgId, ws) {
    return flagOwners.map(owner => {
        if (owner.type === 'user') {
            return `<a href="mailto:${owner.email}" target="_blank">${owner.email}</a>`;
        } else if (owner.type === 'group') {
            return `<a href="https://app.split.io/org/${orgId}/ws/${ws}/admin/groups/details/${owner.id}" target="_blank"> ${owner.ownerName} (Group) </a>`;
        }
    }).join(', ');
}


function updateTable(flags, workspaceId) {
    const tableBody = document.querySelector('#flagsTable tbody');
    // Clear existing table rows
    tableBody.innerHTML = '';
    // Add new rows from the fetched flags
    flags.forEach(flag => {
        const row = `<tr>
        <td><a href="https://app.split.io/org/${flag.orgId}/ws/${workspaceId}/splits/${flag.id}/" target="_blank"> ${flag.name} </a></td>
        <td>${flag.creationTime}</td>
        <td>${flag.lastUpdateTime}</td>
        <td>${flag.lastTrafficReceivedAt}</td>
        <td>${formatFlagOwners(flag.owners, flag.orgId, workspaceId)}</td>
                     </tr>`;
        tableBody.innerHTML += row;
    });
}
// Implement the sortTable function as needed
function sortTable(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("flagsTable");
    switching = true;
    // Make a loop that will continue until no switching has been done:
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        // Loop through all table rows (except the first, which contains table headers):
        for (i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            // Get the two elements you want to compare, one from current row and one from the next:
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            // Check if the two rows should switch place, based on the direction, asc or desc:
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // If a switch has been marked, make the switch and mark that a switch has been done:
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}
