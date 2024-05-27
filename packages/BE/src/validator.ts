import type { Payload } from '@tc39/typings';
import Ajv, { type JSONSchemaType } from 'ajv';

const ajv = new Ajv({ discriminator: true, validateSchema: 'log', strict: 'log' });

// @see {@link https://ajv.js.org/json-schema.html}
const schemaPayload: JSONSchemaType<Payload> = {
	type: 'object',
	discriminator: {
		propertyName: 'event',
	},
	required: ['event'],
	oneOf: [
		{ properties: { event: { const: 'error' }, data: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } } },
		{ properties: { event: { const: 'readAgendaItem' }, data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
		{ properties: { event: { const: 'readMeeting' }, data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
		{ properties: { event: { const: 'readTopic' }, data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
		{ properties: { event: { const: 'readUser' }, data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
		{
			properties: {
				event: { const: 'upsertAgendaItem' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', nullable: true },
						name: { type: 'string' },
						userName: { type: 'string' },
						meetingId: { type: 'string' },
						description: { type: 'string' },
						timebox: { type: 'number' },
						weight: { type: 'number' },
						status: { enum: ['frozen', 'locked', 'late', 'continued'] },
						queue: { type: 'array', items: { type: 'string' }, nullable: true }
					},
					required: ['id', 'name', 'userName', 'meetingId', 'weight'],
				},
			}
		},
		{
			properties: {
				event: { const: 'upsertMeeting' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', nullable: true },
						title: { type: 'string' },
						startDate: { type: 'string' },
						endDate: { type: 'string' },
						location: { type: 'string' },
						status: { enum: ['planned', 'active', 'finished'] },
						agenda: { type: 'array', items: { type: 'string' }, nullable: true },
						chairs: { type: 'array', items: { type: 'integer' }, minItems: 1 },
					},
					required: ['id', 'title', 'startDate', 'endDate', 'location'],
				},
			}
		},
		{
			properties: {
				event: { const: 'upsertTopic' },
				data: {
					type: 'object',
					properties: {
						id: { type: 'string', nullable: true },
						type: { enum: ['general', 'reply', 'question', 'poo'] },
						userName: { type: 'string' },
						userGhId: { type: 'integer' },
						agendaItemId: { type: 'string' },
						content: { type: 'string' },
						weight: { type: 'integer' },
					},
					required: ['id', 'type', 'userName', 'agendaItemId', 'content', 'weight'],
				},
			}
		},

	],
};

// ajv.addSchema(payloadSchema, 'payload');
// export const validatePayload = ajv.getSchema<Payload>('payload');

export const validate = ajv.compile(schemaPayload);

export const ValidationErrorPayloadInvalid: Payload.error = {
	event: 'error',
	data: { message: 'Payload invalid' },
};

export const ValidationErrorPayloadMalformed: Payload.error = {
	event: 'error',
	data: { message: 'Payload malformed' },
};
