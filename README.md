# Flag Debt Dashboard

The Flag Debt Dashboard is a web application that helps you identify and manage stale Split feature flags in your codebase. It provides a centralized view of all feature flags in your workspace and environments so you can see those that haven't been updated or seen traffic in a while.

## Features

- Toggle between grouped and ungrouped view with a simple checkbox
- List all feature flags grouped by owner with total flag count per owner
- Expand/collapse flag groups to focus on specific owners
- Identify stale feature flags based on last update or traffic or creation time
- Click on a column to sort by it
- Click on individual flags to go to the flag in the Split Console
- Click on the Flag Owners to either navigate to the group in the Split Console or open your email client to send an email to a flag owner


## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Split-Community/flag-debt-dashboard.git

2. Put your API key and Org ID in a `.env` file 
    ```
    ADMIN_API_KEY=xxx
    ORG_ID=yyy

3. Install dependancies
    ```bash
    npm i

4. Start the app
    ```bash
    node server.js

5. Navigate to `localhost:3000` to view the app

## Usage

1. Select a workspace from the dropdown
2. Select an environment
3. Click "Load Feature Flags" to fetch the data
4. Toggle the "Group flags by owner" checkbox to instantly switch between views:
   - **Checked**: Shows flags grouped by owner with total counts
   - **Unchecked**: Shows a flat list of all flags
5. When in grouped view:
   - Each owner shows their total flag count
   - Use the "Show/Hide Flags" button next to each owner to expand/collapse their specific flags

![image](https://github.com/user-attachments/assets/7ff1bfba-2bfe-4f10-828b-d975c51db78b)






