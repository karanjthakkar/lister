# Lister Backend Infra Doc

1. Node service for running lister server

        
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
        


2. Location of conf file for node service

    ```
    /etc/init/lister.conf
    ```

3. Node service log location:

    Success: 
    ```
    /home/ubuntu/lister-out.log
    ```

    Error: 
    ```
    /home/ubuntu/lister-err.log
    ```

4. Command for running node service

    Staging:
    ```
    sudo start lister env=staging
    ```
    
    Production
    ```
    sudo start lister env=prod
    ```

5. Command for stopping node service

    ```
    sudo stop lister env=staging
    ```
    
    OR
    
    ```
    sudo stop lister env=prod
    ```
    
6. Trying to acccess mongo cli on EC2 ubuntu has some issues. To fix thos, add the following line to `~/.bashrc`:

    ```
    export LC_ALL=C
    ```

7. Running Mongo CLI on EC2 will give this error at times:

        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/enabled is 'always'.
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/defrag is 'always'.
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
        2015-08-27T14:01:27.449+0000 I CONTROL  [initandlisten]


    Follow steps in link below to fix it:

    ```
    http://stackoverflow.com/a/29181918/1473556
    ```

    More info:

    ```
    http://docs.mongodb.org/manual/tutorial/transparent-huge-pages/#transparent-huge-pages-thp-settings
    ```

8. nginx conf `/etc/nginx/nginx.conf`

        http {
            server {
                listen 80;
                server_name api.lister.co;
                location / {
                    proxy_pass http://127.0.0.1:3000;
                }
            }
        }
