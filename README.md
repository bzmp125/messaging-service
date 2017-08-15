# messaging-service
A reusable messaging service for a Microservices Architecture.

The idea is to help developers get started faster with new projects, allowing them to focus on building their application, which is what really matters. We all know every project will at some point have some form of message that needs to be sent, whether it is a 2FA message via SMS or Email. With an intelligent queuing mechanism, this messaging service allows for emails to be sent out efficiently even for large volumes.

## Underlying APIs
### Email
For Email, the service uses Sparkpost. You can signup [here](https://app.sparkpost.com/join) to get an API Key and also set your sending domains. More info on Sparkpost can be found [here](https://developers.sparkpost.com/api/) on the official documentation.

### SMS 
For SMS, the service uses the [Frello](http://frello.co.zw) API, which is a bulk SMS API with a whole lot of other features like Scheduled and Templated Messages all available on the API. You can signup [here](http://dashboard.frello.co.zw) to create an app/integration and then get an APP_ID and APP_Secret to then use in the service. For more information and helper libraries go to [the Github repo.](https://github.com/bzmp125).

## Getting Started
The service can be deployed on any server, and to get started, you can follow these simple steps.

```
mkdir messaging-service
cd messaging-service
git clone https://github.com/bzmp125/messaging-service
npm install

```

Then you'd have to set the credentials of the APIS as environment variables explained in the [documentation site](). This allows the service to be configurable even on-the-fly or for different deployment enviroments.

The service can be deployed on any server and can be reached via a simple HTTP REST API built with ExpressJS. For more documentation on the actual endpoints, go to the [documentation site]().

## The Future
1. Push Notifications - This will probably be through Firebase's FCM.
2. CLi - to spawn the entire project from an `init` command and also deploy to different cloud providers to help automate the deployment, orchestration and monitoring of the whole application the service would then belong to.
3. Docker image on Docker Hub - because why not!
