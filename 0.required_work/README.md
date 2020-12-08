# Technical Test / Full-stack

**Please read those instructions carefully**, it contains useful information to help you complete the
test successfully.

## Purpose

This test will ask you to develop a micro-service and a optionally front-end application using it. 
Some goals are required and some are optional. The micro-service is responsible for managing the 
loyalty program, and is using an event-driven approach by listening to AMQP messages and reacting 
accordingly.

To facilitate the evaluation, we advise you to use :
- Node >= 10.15
- Express >= 4.14
- MongoDB >= 2.6
- RabbitMQ >= 3.4.1
- React >= 16.2 (if need be)
- nvm >= 0.33 (if need be)
- PostgreSQL >= 9.4 (if need be)

## Additional note

### Message producer

A 'producer' is provided (have a look at the `producer` folder), it simulates a production environment
by generating user events you're supposed to react to (user signup, ride completed, etc.). If you
decide to use it (and we think you should), you will need an AMQP server (like RabbitMQ) running
locally, or you can use the provided Dockerfile. You can get further details in the producer
`README.md` file.

Beware, the producer also simulates erroneous situation that might happen in production!

### Skeletons

This test provide two basic skeletons to help you get started, one for the back-end part (written in
node.js), and one for the front-end part (using React). You can choose to use them or start from
scratch, it's up to you. In any case, those are just basic examples you will need to improve.

You can also use different languages and/or frameworks, as soon as they belong to our
stack (Node.js >= 10.15, Golang >= 1.8, Python >= 3.4).

## Required Goals

### Implement loyalty points earning

Each rider has a status. The status is computed from the user's number of completed rides 
according to the following rule:
```text
  - bronze:     0 <= NB rides < 20
  - silver:    20 <= NB rides < 50
  - gold:      50 <= NB rides < 100
  - platinum: 100 <= NB rides
```

When a rider finishes a ride, he gains an amount of loyalty points. The amount of
points is computed with a multiplier associated to each loyalty status, according to 
the following rule:
```text
  - bronze:   1€ = 1  point
  - silver:   1€ = 3  points
  - gold:     1€ = 5  points
  - platinum: 1€ = 10 points
```

For example:
- If a bronze rider paid 15€, he earns 15 loyalty points.
- If a gold rider paid 8€, he earns 40 loyalty points.

**To complete this goal you must:**
- implement a worker to handle the required set of event messages for users to earn their 
loyalty points 
- provide an API that allows to retrieve current status of a user, along with the number of loyalty 
points he owns and the number of rides he made


## Optional Goals

**You are not required to do those goals to complete the test**!
But each completed additional goal will be a bonus for your review.
Those goals are independent from each other, you can pick which one you want to do.

### Implement a front-end for the rider

Rider must be able to check on a page:
- His current loyalty status
- His current loyalty points
- His current number of rides / remaining to next status
- The screen should be updated regularly

### Add ride history to the front-end

Rider can now see on its page:
- history of His rides with total paid / loyalty points earned

### Monitoring screen with top 10 riders

An admin or employee can access another page displaying a chart with the top 10 riders in the system
(number of rides) that update automatically, without the need for a user action.

### Monitoring screen with top 10 riders by loyalty status

An admin or employee can access another page displaying a chart with the top 10 riders in the system
by loyalty status.

### Monitoring screen with advanced filters and sorts

The top 10 charts can now show the ranking based on number of rides but also loyalty points. The
number of users in the chart can be adjusted.

### Statistics section in monitoring screen

An admin or employee can see another section in the monitoring screen giving various informations
about the loyalty program (number of riders per status, number of loyalty points, rides, etc.)

### Your idea

Propose and implement (a) new idea(s) for the monitoring screen, the rider loyalty screen or something
else to improve the application / the micro-service.


## Expected completion time

A few hours for a basic solution (and a little more if you want to fulfill all the goals) using the
provided skeleton(s).

## More information

### Message producer

Open [documentation](producer/README.md).

### Backend Server Skeleton

Open [documentation](back/README.md).

### Frontend Server Skeleton

Open [documentation](front/README.md).
