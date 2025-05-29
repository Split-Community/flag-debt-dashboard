document.addEventListener('DOMContentLoaded', function() {
    fetchWorkspaces();
    
    // Store fetched flags to avoid refetching when toggling views
    let cachedFlags = [];
    let lastWorkspaceId = null;

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
            lastWorkspaceId = workspaceId;
        } else {
            alert('Please select both a workspace and an environment.');
        }
    });
    
    // Add event listener for the group by owner checkbox
    document.getElementById('groupByOwner').addEventListener('change', function() {
        if (cachedFlags.length > 0) {
            updateTable(cachedFlags, lastWorkspaceId);
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
            
            // Store the fetched flags in the cache for toggling views
            cachedFlags = featureFlags;
            
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
    
    // Check if we should group by owner
    const groupByOwner = document.getElementById('groupByOwner').checked;
    
    if (groupByOwner) {
        // GROUPED VIEW - Group flags by owner
        
        // Create a map to group flags by owner
        const ownerFlagsMap = {};
        
        // Process each flag and group by owner
        flags.forEach(flag => {
            // If a flag has multiple owners, it will be counted for each owner
            if (flag.owners && flag.owners.length > 0) {
                flag.owners.forEach(owner => {
                    // Create a unique key for each owner
                    const ownerKey = owner.type === 'user' ? owner.email : owner.ownerName;
                    
                    // Initialize array for this owner if it doesn't exist
                    if (!ownerFlagsMap[ownerKey]) {
                        ownerFlagsMap[ownerKey] = {
                            owner: owner,
                            flags: [],
                            count: 0
                        };
                    }
                    
                    // Add this flag to the owner's list
                    ownerFlagsMap[ownerKey].flags.push(flag);
                    ownerFlagsMap[ownerKey].count += 1;
                });
            } else {
                // Handle flags with no owners
                const noOwnerKey = 'No Owner';
                if (!ownerFlagsMap[noOwnerKey]) {
                    ownerFlagsMap[noOwnerKey] = {
                        owner: { type: 'none', ownerName: 'No Owner' },
                        flags: [],
                        count: 0
                    };
                }
                ownerFlagsMap[noOwnerKey].flags.push(flag);
                ownerFlagsMap[noOwnerKey].count += 1;
            }
        });
        
        // Sort owners by flag count (descending)
        const sortedOwners = Object.values(ownerFlagsMap).sort((a, b) => b.count - a.count);
        
        // Add owner groups to the table
        sortedOwners.forEach(ownerData => {
            // Add owner header row with count
            const ownerName = ownerData.owner.type === 'user' ? 
                ownerData.owner.email : 
                (ownerData.owner.type === 'group' ? `${ownerData.owner.ownerName} (Group)` : 'No Owner');
                
            const ownerLink = ownerData.owner.type === 'user' ? 
                `<a href="mailto:${ownerData.owner.email}" target="_blank">${ownerData.owner.email}</a>` : 
                (ownerData.owner.type === 'group' ? 
                    `<a href="https://app.split.io/org/${flags[0].orgId}/ws/${workspaceId}/admin/groups/details/${ownerData.owner.id}" target="_blank">${ownerData.owner.ownerName} (Group)</a>` : 
                    'No Owner');
            
            const ownerRow = `<tr class="owner-row">
                <td colspan="5" class="owner-header">
                    <strong>${ownerLink}</strong> - ${ownerData.count} flag${ownerData.count !== 1 ? 's' : ''}
                    <button class="toggle-flags" data-owner="${ownerName}">Show/Hide Flags</button>
                </td>
            </tr>`;
            
            tableBody.innerHTML += ownerRow;
            
            // Add flag rows for this owner (initially hidden)
            ownerData.flags.forEach(flag => {
                const flagRow = `<tr class="flag-row" data-owner="${ownerName}" style="display: none;">
                    <td><a href="https://app.split.io/org/${flag.orgId}/ws/${workspaceId}/splits/${flag.id}/" target="_blank"> ${flag.name} </a></td>
                    <td>${flag.creationTime}</td>
                    <td>${flag.lastUpdateTime}</td>
                    <td>${flag.lastTrafficReceivedAt}</td>
                    <td>${formatFlagOwners(flag.owners, flag.orgId, workspaceId)}</td>
                </tr>`;
                
                tableBody.innerHTML += flagRow;
            });
        });
        
        // Add event listeners to toggle buttons
        document.querySelectorAll('.toggle-flags').forEach(button => {
            button.addEventListener('click', function() {
                const ownerName = this.getAttribute('data-owner');
                const flagRows = document.querySelectorAll(`tr.flag-row[data-owner="${ownerName}"]`);
                
                flagRows.forEach(row => {
                    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                });
            });
        });
    } else {
        // UNGROUPED VIEW - Show flags in a flat list
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
}
// Implement the sortTable function as needed
function sortTable(columnIndex) {
    // Get all owner groups from the table
    const table = document.getElementById("flagsTable");
    const tbody = table.querySelector('tbody');
    const ownerRowsNodeList = tbody.querySelectorAll('tr.owner-row');
    const ownerRows = Array.from(ownerRowsNodeList);
    
    // For each owner group, sort its flag rows
    ownerRows.forEach(ownerRow => {
        // Get the owner name from the button's data attribute
        const ownerName = ownerRow.querySelector('.toggle-flags').getAttribute('data-owner');
        
        // Get all flag rows for this owner
        const flagRowsSelector = `tr.flag-row[data-owner="${ownerName}"]`;
        const flagRowsNodeList = tbody.querySelectorAll(flagRowsSelector);
        const flagRows = Array.from(flagRowsNodeList);
        
        // Sort the flag rows based on the selected column
        flagRows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.toLowerCase();
            const bValue = b.cells[columnIndex].textContent.toLowerCase();
            return aValue.localeCompare(bValue);
        });
        
        // Remove all flag rows for this owner
        flagRows.forEach(row => row.remove());
        
        // Insert the sorted flag rows after the owner row
        let currentNode = ownerRow;
        flagRows.forEach(row => {
            currentNode.after(row);
            currentNode = row;
        });
    });
    
    // Also sort the owner rows based on their first flag's value in the selected column
    // This gives the appearance of sorting the whole table while maintaining the grouping
    ownerRows.sort((a, b) => {
        // Get owner names
        const aOwnerName = a.querySelector('.toggle-flags').getAttribute('data-owner');
        const bOwnerName = b.querySelector('.toggle-flags').getAttribute('data-owner');
        
        // Get the first flag row for each owner
        const aFirstFlagSelector = `tr.flag-row[data-owner="${aOwnerName}"]`;
        const bFirstFlagSelector = `tr.flag-row[data-owner="${bOwnerName}"]`;
        
        const aFirstFlag = tbody.querySelector(aFirstFlagSelector);
        const bFirstFlag = tbody.querySelector(bFirstFlagSelector);
        
        // If either owner has no flags, use the owner name for sorting
        if (!aFirstFlag || !bFirstFlag) {
            return aOwnerName.localeCompare(bOwnerName);
        }
        
        // Otherwise sort by the content of the specified column
        const aValue = aFirstFlag.cells[columnIndex].textContent.toLowerCase();
        const bValue = bFirstFlag.cells[columnIndex].textContent.toLowerCase();
        return aValue.localeCompare(bValue);
    });
    
    // Rebuild the table with sorted owner groups
    ownerRows.forEach(ownerRow => {
        // Get owner name
        const ownerName = ownerRow.querySelector('.toggle-flags').getAttribute('data-owner');
        
        // Get all flag rows for this owner
        const flagRowsSelector = `tr.flag-row[data-owner="${ownerName}"]`;
        const flagRowsNodeList = document.querySelectorAll(flagRowsSelector);
        const flagRows = Array.from(flagRowsNodeList);
        
        // Remove owner row and all its flag rows
        ownerRow.remove();
        flagRows.forEach(row => row.remove());
        
        // Add owner row back to table body
        tbody.appendChild(ownerRow);
        
        // Add flag rows back after owner row
        flagRows.forEach(row => {
            tbody.appendChild(row);
        });
    });
    
    // Re-add event listeners for toggle buttons since we've rebuilt the DOM
    document.querySelectorAll('.toggle-flags').forEach(button => {
        button.addEventListener('click', function() {
            const ownerName = this.getAttribute('data-owner');
            const flagRows = document.querySelectorAll(`tr.flag-row[data-owner="${ownerName}"]`);
            
            flagRows.forEach(row => {
                row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
            });
        });
    });
}
