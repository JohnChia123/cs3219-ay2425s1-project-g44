// controllers/matchingController.js
const { Kafka } = require('kafkajs');
const EventEmitter = require('events');
const QUEUE_TIME = 30000;
const BATCH_INTERVAL = 10000;

// Kafka setup
const kafka = new Kafka({
    clientId: 'matching-service',
    brokers: ['kafka:9092'],  // 'kafka' is the service name from docker-compose
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await producer.disconnect();
    await consumer.disconnect();
    process.exit(0);
  });

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'matching-group' });

(async () => {
    try {
        await producer.connect();
        await consumer.connect();
    } catch(error) {
        console.error(error)
    }
})();

const eventEmitter = new EventEmitter();
let dequeued = new Map();

const matchmakeUser = async (userId, questions) => {
    return new Promise((resolve, reject) => {
        produceMessage({
            userId: userId,
            questions: questions
        }, false);
        eventEmitter.once(`success-${userId}`, (peerUserId, question) => {
            const res = {
                event: "match-success",
                userId: userId,
                peerUserId: peerUserId,
                agreedQuestion: question
            }
            resolve(JSON.stringify(res));
            // resolve(`User ${userId} matched with User ${peerUserId}.`)
        });
        eventEmitter.once(`dequeue-${userId}`, () => {
            dequeued.set(userId, true);
            const res = {
                event: "dequeued-success",
                userId: userId
            }
            resolve(JSON.stringify(res));
            // resolve(`User ${userId} dequeued from matchmaking.`)
        })
        setTimeout(() => {
            const rejectionMsg = {
                event: "match-timeout",
                userId: userId
            };
            reject(JSON.stringify(rejectionMsg));
            // reject(`No matches for ${userId}.`)
        }, QUEUE_TIME);
    })
}

const dequeueUser = async (userId) => {
    eventEmitter.emit(`dequeue-${userId}`);
}

// Produce a message to Kafka (used in the POST /produce route)
const produceMessage = async (request, isRequeue = false) => {
    const msg = {
        userId: request.userId,
        questions: request.questions,
        enqueueTime: isRequeue ? request.enqueueTime : Date.now()
    }
    const stringifiedMsg = JSON.stringify(msg)
    const message = {
        topic: 'test-topic',
        messages: [
            {value: stringifiedMsg}
        ],
    }
    try {
        await producer.send(message).then(() => {
            console.log(`Enqueued message: ${stringifiedMsg}`)
        });
    } catch (error) {
        console.error('Error producing message:', error);
    }
};

// Produce a startup message when the service starts
const produceStartupMessage = async () => {
    try {
        const message = 'Hello from producer';
        console.log(`Produced startup message: ${message}`);
    } catch (error) {
        console.error('Error producing startup message:', error);
    }
};

let batch = [];

const batchProcess = () => {
    if (batch.length == 0) {
        console.log("No messages to process in this batch cycle.");
        return;
    }
    batch.sort((A, B) => A.questions.length - B.questions.length);
    console.log(`sorted batch is`, batch);
    let questionDict = new Map();
    let unmatchedUsers = new Map();
    batch.forEach((user) => {
        if (!dequeued.has(user.userId)) {
            unmatchedUsers.set(user.userId, user);
        }
    });
    for (const user of batch) {
        if (Date.now() - user.enqueueTime >= QUEUE_TIME) {
            // User has timed out.
            // TODO: send timeout event emitter.
            unmatchedUsers.delete(user.userId);
            continue;
        }
        if (!unmatchedUsers.has(user.userId)) {
            // User has already been matched/dequeued.
            continue;
        }
        
        user.questions.forEach((question) => {
            const peerUserId = questionDict.get(question);
            // Note: UserId cannot be 0, 
            // since 0 is falsy and would break this if-conditional.
            if (peerUserId && unmatchedUsers.has(peerUserId)) {
                // Found match!!
                eventEmitter.emit(`success-${user.userId}`, peerUserId, question)
                eventEmitter.emit(`success-${peerUserId}`, user.userId, question)
                unmatchedUsers.delete(user.userId);
                unmatchedUsers.delete(peerUserId);
            } else {
                // Else, keep looking
                questionDict.set(question, user.userId)
            }
        })
    }
        for (const [key, user] of unmatchedUsers) {
            produceMessage(user, true)
            console.log(`User ${key} returned to queue.`)
        }
        batch = [];
        dequeued.clear();
};

// Start consuming messages from Kafka
const runConsumer = async () => {
    try {
        await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

        setInterval(batchProcess, BATCH_INTERVAL);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const parsedJsonMsg = JSON.parse(message.value);
                batch.push(parsedJsonMsg);
            },
        });
    } catch (error) {
        console.error('Error running consumer:', error);
    }
};

module.exports = {
    runConsumer,
    matchmakeUser,
    dequeueUser
};
