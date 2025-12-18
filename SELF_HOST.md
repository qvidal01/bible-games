Self-host PostHog
PostHog is open-source and freely available for anyone to host themselves. We offer a free Docker Compose deployment under an MIT license. Essentially, self-hosting PostHog means you run or purchase your own infrastructure, manage deployments, choose your own URLs to expose it on, and deal with any scaling issues yourself.

The self-hosted version is the same exact product we run on PostHog Cloud, though our infrastructure is very, very different to support serious volume. We don't do tagged releases for self-hosted PostHog. All commits go through our standard CI/CD pipeline before they are merged into our cloud deployments and also become available for self-hosted instances.

Because we don't manage self-hosted instances or provide paid support plans for them, we don't offer any sort of guarantees around it working in certain ways on your infrastructure, and you assume all responsibility and risk for your use of the product and the stack.


TLDR;
There are warnings and useful information below, so we recommend reading the whole document... but there are two commands for interacting with the hobby deploy


Installing
Terminal


/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/deploy-hobby)"

Upgrading
Terminal


/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/upgrade-hobby)"

Should I use self-hosted PostHog or PostHog Cloud?
Good question! We've found that PostHog Cloud is far and away the best experience for the vast majority of our users. However, some people still want to self-host, and we're here for that! Here's a quick flow chart to help you understand if self-hosting PostHog is for you:







































You can follow the rest of the guide for instructions on how to set up self-hosted PostHog. If you want to use Cloud instead, you can sign up for our US or EU cloud instance.


Requirements
You have deployed a Linux Ubuntu Virtual Machine.
You will need something equivalent to a Hetzner VM with 4 vCPU, 16GB RAM, and more than 30GB storage.
You have set up an A record to connect a custom domain to your instance.
PostHog will automatically create an SSL certificate for your domain using LetsEncrypt
New deployments of PostHog's paid open source product using Kubernetes are no longer supported.


Configuration
There are various ways to configure and personalize your PostHog instance to better suit your needs. In this section you will find all the information you need about settings and options you can configure to get what you need out of PostHog.

Environment variables
Upgrading PostHog
Securing PostHog
Running behind proxy
Email configuration

Setting up the stack
To get started, all we need to do is run the following command, which will spin up a fresh PostHog deployment for us automatically!

Terminal


/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/deploy-hobby)"
You'll now be asked to provide the release tag you would like to use, as well as the domain you have connected to your instance.

This release tag is the DockerHub tag and doesn't refer to the sunsetted Helm chart releases

Once everything has been setup, you should see the following message:



We will need to wait ~5-10 minutes for things to settle down, migrations to finish, and TLS certs to be issued

⏳ Waiting for PostHog web to boot (this will take a few minutes)
PostHog will wait here on a couple of tasks that need to be completed, which should only take a couple minutes.

Once this is complete, you should be able to see your PostHog dashboard on the domain you provided!

If you notice this step taking longer than 10 minutes, it's best to cancel it with Ctrl+C and take a look at the troubleshooting section.


Customizing your deployment (optional)
By default, the docker-compose.yml file that gets run comes with a series of default config values that should work for most deployments. If you need to customize anything, you can take a look at the full list of environment variables. After making any changes, simply restart the stack with docker-compose.

Additionally, if you would like to run a different version of PostHog, you can change the tag for the web, worker, and plugins services. Check out the PostHog Docker Hub repository for a list of all available tags.


Troubleshooting
If you have already run the one-step deployment command above and something went wrong, this section covers a number of steps you can take to debug issues.


Checking that all containers are running
We can use docker ps to check that all of our services are running.

Terminal


$ docker ps

CONTAINER ID   IMAGE                               COMMAND     CREATED    STATUS    PORTS   NAMES
21a2f62d6e50   posthog/posthog:release-1.39.1      ...         1m ago     Up 1m     ...     ...
77face12d3e2   posthog/posthog:release-1.39.1      ...         1m ago     Up 1m     ...     ...
3b4bc7394049   posthog/posthog:release-1.39.1      ...         1m ago     Up 1m     ...     ...
03f393c7aa84   caddy:2.6.1                         ...         1m ago     Up 1m     ...     ...
f1060c3d8d73   clickhouse/clickhouse-server:22.3   ...         1m ago     Up 1m     ...     ...
7d2353a6bddf   bitnami/kafka:2.8.1-debian-10-r99   ...         1m ago     Up 1m     ...     ...
72051397040e   zookeeper:3.7.0                     ...         1m ago     Up 1m     ...     ...
ff42ccf14481   redis:6.2.7-alpine                  ...         1m ago     Up 1m     ...     ...
402a0eef69ae   postgres:12-alpine                  ...         1m ago     Up 1m     ...     ...
da0d115dd02e   minio/minio                         ...         1m ago     Up 1m     ...     ...
You should see all the same containers as above. If any containers aren't showing up or show that they've restarted recently, it's worth checking their logs to see what the issue is.


Checking the logs of each container
We can use the following command to check the logs for each of our containers.

Terminal


docker logs <container_name>
The best place to start looking is in the web container, which runs all the database migrations and will produce an error if any have failed.

Running into issues with deployment? Ask a question here or check out our community page to get help.


Upgrading
To upgrade, you can run the upgrade-hobby script from the PostHog repo.

Terminal


/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/upgrade-hobby)"
Warning: Before upgrading, make sure you have created back-ups of all your data!

Our recommendation is to keep your PostHog deployment up-to-date. While we avoid breaking changes wherever possible we may sometimes deprecate or add features that require you to update to the latest version. You can track our latest updates in the changelog.


Migrating
If your server is struggling, you can either increase your instance size or move to PostHog Cloud for a hands-off experience

Community questions
sagar
4 days ago


getting error while insatting Plugin server · Node Error
hey sagar this side i am successfully able to install after that when i am going to configure it getting error "Plugin server · Node Error" error can you please suggest what should i do now?

Huy
3 days ago

same here


0

0

Reply
Luk
Edited 11 days ago


stable version
can anyone recommend stable tag / branch selfhosted installation ?

Abhinav Reddy
6 days ago

If anyone have info over this, pls help.


0

0

Reply
Abhinav Reddy
17 days ago


session replay is not working.
I have been trying to install the self-hosted version but the session-replay is not working from past month after you have migrated to seaweed-fs.

Thanks

View 2 more replies
Laurenz
13 days ago

Hi Abhinav, unfortunately I was not able to get it running. So we put the PostHog integration in our product on hold until the session recording gets fixed...


0

0

Reply
amzker
a month ago


session reply video programmatic access
if i self host , will i be able to access session reply video files outside of UI . i understand that rendering and restructuring would be required , but will i have directly file access to it or not.


Reply

hoang
2 months ago


Error with clickhouse
2025.10.27 03:30:58.177920 [ 1203 ] {} Settings: Unknown settings: query_id, skipping 2025.10.27 03:31:20.993585 [ 1204 ] {d0953688-3800-4d37-8d71-e6900646f713} executeQuery: Code: 60. DB::Exception: Table posthog.infi_clickhouse_orm_migrations_distributed does not exist. (UNKNOWN_TABLE) (version 25.6.13.41 (official build)) (from 172.18.0.6:58274) (in query: SELECT DISTINCT module_name FROM posthog.infi_clickhouse_orm_migrations_distributed WHERE package_name = 'posthog.clickhouse.migrations' FORMAT TabSeparatedWithNamesAndTypes), Stack trace (when copying this message, always include the lines below) installation just hangs for hours


Reply
Saygun
2 months ago


Is there project limit on self-hosted Posthog
Hi! I have set up a self-hosted Posthog. However, I cannot see "+ New project" in the dropdown, and when I try to create a project via API, I get the following error:

{"type":"authentication_error","code":"permission_denied","detail":"You have reached the maximum limit of allowed projects for your current plan. Upgrade your plan to be able to create and manage more projects.","attr":null}

There is only the 'Default project' at the moment. Is there a project limit cap on self-hosted Posthog?


Reply
Le
4 months ago


$exception event (in events_plugin_ingestion topic) not push to clickhouse_events_json topic
Hi bros, Please show me "$exception" event data flow.

Thanks


Joel
3 months ago

bump


0

0

Reply
Esakki
4 months ago


/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/upgrade-hobby)"
i have facing an issue while running the all docker-compose. the issue is three of the compose was restarting again and again it's logs says some error i didn't know what it is. These three are the thing restarting

posthog/posthog:latest
ghcr.io/posthog/posthog/feature-flags:master
ghcr.io/posthog/posthog/property-defs-rs:master
CONTAINER ID   IMAGE                                               COMMAND                  CREATED          STATUS                            PORTS                                                                                             NAMES
1edc1cee5e3d   caddy                                               "sh -c 'set -x && ec…"   52 seconds ago   Up 50 seconds                     0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 443/udp, 2019/tcp   ph-proxy-1
df7d2f14d3df   posthog/posthog:latest                              "/usr/local/bin/dock…"   52 seconds ago   Up 15 seconds                     80/tcp, 8000-8001/tcp                                                                             ph-web-1
a6eed76d9d1e   posthog/posthog:latest                              "/usr/local/bin/dock…"   52 seconds ago   Up 7 seconds                      80/tcp, 8000-8001/tcp                                                                             ph-plugins-1
73d00a4f1e1e   temporalio/admin-tools:1.20.0                       "tail -f /dev/null"      52 seconds ago   Up 45 seconds                                                                                                                       ph-temporal-admin-tools-1
aad227c72bf5   temporalio/ui:2.31.2                                "./start-ui-server.sh"   52 seconds ago   Up 44 seconds                     0.0.0.0:8081->8080/tcp, [::]:8081->8080/tcp                                                       ph-temporal-ui-1
9cf6e331ac74   clickhouse/clickhouse-server:25.3.6.56              "/entrypoint.sh"         52 seconds ago   Up 5



Igor
a month ago

I had a problem when installing using

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/deploy-hobby)" With ghcr.io/posthog/posthog/property-defs-rs:master.

It was saying that can't create kafka topic ( in configuration I saw that kafka topic creation is auto enabled ). I tried few things, and after that I decided to "upgrade".

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/posthog/posthog/HEAD/bin/upgrade-hobby)"

After the upgrade I didn't have a problem with that container, but I started getting a problem with posthog/posthog:latest.


0

0

Reply

Silvestr
6 months ago


Please update CPU requirement AVX requirement?
Hello, we are looking for analytics solution for closed network (no internet connection). While I was trying PostHog I did notice that default Proxmox VM is not able to finish install, due to default CPU virtualization to x86-64-v2-AES. Got error 'Illegal instruction'. My guess is PostHog need AVX instruction?

Maybe you could add some notice to docs?

For those whit these error, you need correct CPU and in Proxmox, change type to host in Processors settings.

not working x86-64-v2-AES setting shows: Flags: fpu de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx lm rep_good nopl cpuid extd_apicid tsc_known_freq pni ssse3 cx16 sse4_1 sse4_2 x2apic popcnt aes hypervisor lahf_lm cmp_legacy 3dnowpref etch vmmcall Install was stuck on some Illegal instruction error

working hosts setting: Flags: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ht syscall nx mmxext fxsr_opt pdpe1gb rdtscp lm rep_good nopl cpuid extd_apicid tsc_known_freq pni pclmulqdq ssse3 fma cx16 sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm cmp_legacy svm cr8_legacy abm sse4a misalignsse 3dnowprefetch osvw perfctr_core ssbd ibpb stibp vmmcall fsgsbase tsc_adjust bmi1 avx2 smep bmi2 rdseed adx smap clflushopt clwb sha_ni xsaveopt xsavec xgetbv1 clzero xsaveerptr wbnoinvd arat npt lbrv nrip_save tsc_scale vmcb_clean flushbyasid pausefilter pfthreshold v_vmsave_vmload vgif umip rdpid overflow_recov succor arch_capabilities


Reply
Bernhard
7 months ago


After rebooting the server Posthog is down
Installation goes well and everything workd. But after rebooting the server there is only a "502 Bad Gateway" error in the browser.

Tusher
6 months ago

Response of Qwen AI.

The screenshot shows two community questions related to PostHog, a product analytics platform. Let's analyze each question and provide potential solutions:

Question 1:
User: Bernhard
Issue: After rebooting the server, PostHog is down, and there is a "502 Bad Gateway" error in the browser.

Analysis:
A "502 Bad Gateway" error typically indicates that the server (PostHog) is not responding correctly to requests from the web server (e.g., Nginx or Apache). This could be due to:

PostHog not starting properly after the server reboot.
Configuration issues with the reverse proxy (e.g., Nginx).
Database connectivity problems.
Insufficient resources (CPU, memory).
Solution Steps:
Check if PostHog is Running:

Use the command sudo systemctl status posthog (if using systemd) or sudo service posthog status to verify if the PostHog service is running.
If it's not running, start it using sudo systemctl start posthog or sudo service posthog start.
Verify Reverse Proxy Configuration:

Ensure that your reverse proxy (e.g., Nginx) is configured correctly to forward requests to PostHog.
Check the Nginx configuration file (usually located at /etc/nginx/sites-available/posthog) for any errors.
Restart Nginx using sudo systemctl restart nginx.
Check Database Connectivity:

Ensure that PostHog can connect to its database (PostgreSQL by default).
Run psql -U postgres to check if the PostgreSQL service is running and accessible.
Verify that the database credentials in the PostHog configuration file (posthog.env) are correct.
Check Logs for Errors:

Look at the PostHog logs for more detailed error messages:
sudo journalctl -u posthog

Also, check Nginx logs:
cat /var/log/nginx/error.log

Restart Services:

Sometimes, simply restarting all services can resolve temporary

0

0

Reply
rrem
8 months ago


Could provide minium self-host posthog config or article about this field
as it is,i want self host posthog more customizable, it's seems there are a lot of server are legacy on docer compose,but no one know which is required which is unnecessary


Reply
rahul
Edited 9 months ago


Forbidden (403) CSRF verification failed. Request aborted.
I have self hosted posthog on GCP and integrated into my next js application currently am facing "Forbidden (403) CSRF verification failed. Request aborted" for the below api calls where events are getting captured Request URL: https://{Url}/i/v0/e/?ip=1&_=1741776541825&ver=1.224.0&compression=gzip-js Request Method: POST Status Code: 403 Forbidden


View 5 more replies

David
5 months ago

I had this recently, and it was because the hobby docker-compose.yml caddy config was forwarding all traffic to the web service, while the capture endpoints have been removed from that service to the capture service. The relevant Caddy config is present in the proxy service of the docker-compose.base.yml.


0

0

Reply
Alex
Edited 10 months ago


401 Unauthorized on /api/billing causing looping login
Thanks for fixing the recent issues with cyclotron and clickhouse. I finally got the self-hosted app running and have signed up successfully. However, I can't get past the login screen. Looking at the web-1 logs, the login is successful (username and pw is okay) but eventually authorization fails at the requests to /api/billing/get_invoices and /api/billing. Did I miss a step? Any advice what I can do?

(Not sure if it has anything to do with it, I'm accessing the app running on the EC2 instance via http://{IP address}, not using https://{domain name}. I'm using Experimental mode.)


View 2 more replies
Lucas
9 months ago

Hey folks. I was able to resolve this issue by correctly setting up the domain name with a valid certificate. When utilizing SSL both endpoints responded correctly and I was able to log in.


0

0

Reply

Paul
10 months ago


This does not take 5-10 minutes!
Unless you are using a quantum computer



View 12 more replies

Paul
Author
10 months ago

Not even got to trying tracking yet but that doesn't sound good. Eurgh


0

0

Reply
KARTIK
10 months ago


Search For Properties and Event not working
I have self deployed and the event tracking is working fine but i can't search anywhere directly I have checked the network tab the search api give no result but HogQL work and give applies that filter what should I do in this case ?

Screenshot 2025-02-13 at 5.26.03 PM.png


Oleg
10 months ago

How did you solve the problem of connecting to clickhouse when deploying posthog?


0

0

Reply
triplenty
Edited 10 months ago


web-1 Container Encountered Errors
The following error happens:

  File "/code/posthog/async_migrations/migrations/0002_events_sample_by.py", line 154, in is_required
    table_engine = sync_execute(
                   ^^^^^^^^^^^^^
IndexError: list index out of range

I checked the code, this line tries to query table "events" while it's not created in postgres. Then I checked an previous error, it seems the container is trying to send requests to clickhouse, but using the "localhost:9000" which seems to be wrong since localhost is pointing to container itself instead of clickhouse container.

    |   File "/python-runtime/clickhouse_driver/connection.py", line 417, in connect
    |     raise err
    | clickhouse_driver.errors.NetworkError: Code: 210. Connection refused (127.0.0.1:9000)

The only change I made to clickhouse container is changing it's tag to 24.11.3.66 because version 24.10 encountered an error




View 8 more replies
al
9 months ago

It is incredible that the PostHog developers think that everyone wants a script to install and get everything working (ready to go), and maybe for some people this is the case, but they need to think that in the world of microservices there can be many different configurations.

In my case I have postgre, redis, kafka, clickhouse in independent clusters and in different ports than those in the hardcoded code.... (e.g. clickhouse port).

When I try to start posthog, I get the following message:

| clickhouse_driver.errors.NetworkError: Code: 210. Connection refused (127.0.0.1:9000)

I have configured the environment variable CLICKHOUSE_HOST and I had to create a dockerfile with the following content to change the port that posthog points to by default (a real nonsense when it is as simple as adding an environment variable)

FROM posthog/posthog:latest 
RUN sed -i '/_clickhouse_http_port = "8123"/ s/'8123'/'8085'/' /code/posthog/settings/data_stores.py 

Can anyone give me some advice on how to proceed with the installation? This PoC is proving to be more frustrating than I though...


0

0

Reply
triplenty
10 months ago


Default Proxy Settings Seems to Be Wrong
the web-1 container has logs like:

{'event': "\n                You indicated your instance is behind a proxy (IS_BEHIND_PROXY env var),\n                but you haven't configured any trusted proxies. See\n                https://posthog.com/docs/configuring-posthog/running-behind-proxy for details.\n            ", 'timestamp': '2025-02-07T16:48:52.541553Z', 'logger': 'posthog.settings.access', 'level': 'warning', 'pid': 7, 'tid': 140265971866496}

Devin
10 months ago

Were you able to fix the issue?


0

0

Harish
10 months ago

I see this also, but it didn't seem to stop the app from running when I last was able to get it to work.


0

0

Reply
triplenty
Edited 10 months ago


deploy error
the container cyclotron-fetch-1 and cyclotron-janitor-1 starts failed. Docker logs shows that "database "cyclotron" does not exist"

should I manually create the database?


Harish
10 months ago

I am also interested in the solution to this.

What this means (I think) in practice is that when I try to run an asynchronous job to e.g. sync data with a different source, it never does it.


0

0

Reply
Tama
a year ago


Forbidden and CORS error
I've got errors of forbidden and CORS to my self-hosted PostHog already tried to add ALLOWED_HOST inside the docker-compose.yml for the web container but the issues are still not solved

image (6).png


View 5 more replies

Vlad
a year ago
Solution

After some investigation I found the workaround: Add NEW_ANALYTICS_CAPTURE_EXCLUDED_TEAM_IDS: 1 environment variable to web container in docker-compose file, So all capture events will go throw /e/ endpoint


1

0

Reply
imran
a year ago


self hosted on aws ubuntu
Validation checks

9 successful, 1 error

Plugin server · Node is showing error.

any way to debug it? https://tinyurl.com/ymlzlfso


Paul
(he/him)
a year ago

hey,

I believe the fix is here... https://github.com/PostHog/posthog/pull/25454

in the meantime you can set that env variable and things should work
