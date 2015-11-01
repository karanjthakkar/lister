# Lister Backend Infra Doc


## API Docs

### 1. Get User Profile

Endpoint: `/users/:id` (GET)

Response:

```
{
    "id": 2296428188,
    "description": "Growth Hacker | Author: https://t.co/GeSyr8bIF9 | Featured in @HuffingtonPost | Tech @Crowdfire | @HootsuiteAPAC Ambassador | Gujju | Cold Coffee is ❤",
    "name": "Karan Thakkar",
    "username": "geekykaran",
    "followers": "13356",
    "following": "10468",
    "profile_image_url": "https://pbs.twimg.com/profile_images/582764841208688640/O6EDiW4B_normal.jpg",
    "profile_banner_url": "https://pbs.twimg.com/profile_banners/2296428188/1433272682",
    "created_at": 1446371459992,
    "list_added": [
        {
            "list_id": "200410211",
            "list_mode": "private",
            "list_member_count": "0",
            "list_subscriber_count": "0",
            "list_description": "",
            "list_name": "GrowthHacker",
            "list_created_at": "Sun Mar 29 17:49:50 +0000 2015",
            "_id": "5635eab7b12a2750865f80f9",
            "list_added_at": "1446374071213"
        },
        {
            "list_id": "89818497",
            "list_mode": "public",
            "list_member_count": "49",
            "list_subscriber_count": "362",
            "list_description": "You should participate and meet awesome people or organizations and other folks who do what you do.",
            "list_name": "Conferences",
            "list_created_at": "Thu May 16 05:25:16 +0000 2013",
            "_id": "5635ead1b12a2750865f80fa",
            "list_added_at": "1446374097019"
        }
    ]
}
```

### 2. Get Lists to Select from Twitter

Endpoint: `/users/:id/lists` (GET)

Response: 

```
{
    "success": true,
    "data": [
        {
            "list_id": "204399686",
            "list_mode": "private",
            "list_member_count": 329,
            "list_subscriber_count": 0,
            "list_description": "",
            "list_name": "Keep-In-Touch",
            "list_created_at": "Thu Apr 30 20:14:13 +0000 2015",
            "list_added": false,
            "is_owner": true
        },
        {
            "list_id": "200410211",
            "list_mode": "private",
            "list_member_count": 0,
            "list_subscriber_count": 0,
            "list_description": "",
            "list_name": "GrowthHacker",
            "list_created_at": "Sun Mar 29 17:49:50 +0000 2015",
            "list_added": true,
            "is_owner": false
        }
    ]
}
```

### 3. Add a list to selected list



Endpoint: `/users/:id/lists_added/:list_id` (PUT)
Response: 

```
{
  success: true, // (or false)
  message: 'Message present if success is false'
}
```

### 4. Remove a list from selected list



Endpoint: `/users/:id/lists_added/:list_id` (DELETE)
Response: 

```
{
  success: true, // (or false)
  message: 'Message present if success is false'
}
```

## Deployment Instructions


### 1. Node service for running lister server

```        
description "Lister"
author      "Karan"

stop on shutdown
respawn
respawn limit 20 5

# Max open files are @ 1024 by default. Bit few.
limit nofile 32768 32768

instance $env

script
    #listerco
    export lister_consumer_key=<consumer_key>
    export lister_consumer_secret=<consumer_secret>
    export lister_access_token=<access_token>
    export lister_access_token_secret=<access_secret>
    exec /usr/bin/node /home/ubuntu/lister/app.js --environment=$env >> /home/ubuntu/lister-out.log 2>>/home/ubuntu/lister-err.log
end script
```        


### 2. Location of conf file for node service

```
/etc/init/lister.conf
```

### 3. Node service log location:

Success: 
```
/home/ubuntu/lister-out.log
```

Error: 
```
/home/ubuntu/lister-err.log
```

### 4. Command for running node service

Staging:
```
sudo start lister env=staging
```

Production
```
sudo start lister env=prod
```

### 5. Command for stopping node service

```
sudo stop lister env=staging
```

OR
    
```
sudo stop lister env=prod
```
    
### 6. Trying to acccess mongo cli on EC2 ubuntu has some issues. To fix thos, add the following line to `~/.bashrc`:

```
export LC_ALL=C
```

### 7. Running Mongo CLI on EC2 will give this error at times:

```
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/enabled is 'always'.
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/defrag is 'always'.
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]
```

Follow steps in link below to fix it:

```
http://stackoverflow.com/a/29181918/1473556
```

More info:

```
http://docs.mongodb.org/manual/tutorial/transparent-huge-pages/#transparent-huge-pages-thp-settings
```

### 8. nginx conf `/etc/nginx/nginx.conf`

```
http {
    server {
        listen 80;
        server_name api.lister.co;
        location / {
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
```
