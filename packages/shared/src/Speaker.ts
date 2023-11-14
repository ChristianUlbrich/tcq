import User from './User.js';

export default interface Speaker {
  topic: string;
  type: TopicTypes;
  user: User;
  id: string;
};

export type TopicTypes = 'topic' | 'reply' | 'question' | 'poo';
