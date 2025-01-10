# Flag Debt Dashboard

The Flag Debt Dashboard is a web application that helps you identify and manage stale Split feature flags in your codebase. It provides a centralized view of all feature flags in your workspace and environments so you can see those that haven't been updated or seen traffic in a while.

## Features

- List all feature flags 
- Identify stale feature flags based on last update or traffic or creation time
- Click on a column to sort by it. 
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

![image](https://github.com/user-attachments/assets/dafd08d7-846c-4f0a-8400-c205e4187a96)



