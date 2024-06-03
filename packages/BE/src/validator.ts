import type { Payload } from '@tc39/typings';
import Ajv, { type JSONSchemaType, type ErrorObject } from 'ajv';

const ajv = new Ajv({ discriminator: true, validateSchema: 'log', strict: 'log' });

// @see {@link https://ajv.js.org/json-schema.html}
const schemaPayload: JSONSchemaType<Payload> = {
	type: 'object',
	discriminator: {
		propertyName: 'event',
	},
	required: ['event'],
	oneOf: [
		{
			properties: {
				event: { const: 'error' },
				jobId: { type: 'string', nullable: true },
				data: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] }
			}
		},
		{
			properties: {
				event: { const: 'getAgenda' },
				jobId: { type: 'string', nullable: true },
				data: {
					oneOf: [
						{ type: 'array', items: { type: 'object', properties: { meetingId: { type: 'string' } }, required: ['meetingId'] } },
						{ type: 'object', properties: { meetingId: { type: 'string' } }, required: ['meetingId'] }
					]
				}
			}
		},
		{
			properties: {
				event: { const: 'getAgendaItem' },
				jobId: { type: 'string', nullable: true },
				data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
			}
		},
		{
			properties: {
				event: { const: 'getMeeting' },
				jobId: { type: 'string', nullable: true },
				// get meeting by status 'active' or by id
				data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
			}
		},
		{
			properties: {
				event: { const: 'getQueue' },
				jobId: { type: 'string', nullable: true },
				data: {
					oneOf: [
						{ type: 'array', items: { type: 'object', properties: { agendaItemId: { type: 'string' } }, required: ['agendaItemId'] } },
						{ type: 'object', properties: { agendaItemId: { type: 'string' } }, required: ['agendaItemId'] }
					]
				}
			}
		},
		{
			properties: {
				event: { const: 'getTopic' },
				jobId: { type: 'string', nullable: true },
				data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
			}
		},
		{
			properties: {
				event: { const: 'getUser' },
				jobId: { type: 'string', nullable: true },
				data: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
			}
		},
		{
			properties: {
				event: { const: 'setAgendaItem' },
				jobId: { type: 'string', nullable: true },
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
						status: { enum: ['frozen', 'locked', 'late', 'continued', null], nullable: true },
						queue: { type: 'array', items: { type: 'string' }, nullable: true }
					},
					required: ['id', 'name', 'userName', 'meetingId', 'weight'],
				},
			}
		},
		{
			properties: {
				event: { const: 'setMeeting' },
				jobId: { type: 'string', nullable: true },
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
				event: { const: 'setTopic' },
				jobId: { type: 'string', nullable: true },
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
					required: ['id', 'type', 'userName', 'userGhId', 'agendaItemId', 'content', 'weight'],
				},
			}
		},

	],
};

// ajv.addSchema(payloadSchema, 'payload');
// export const validatePayload = ajv.getSchema<Payload>('payload');

export const validate = ajv.compile(schemaPayload);

export const ValidationErrorPayloadInvalid = (errors: ErrorObject[]): Payload.error => ({
	event: 'error',
	data: { message: `Payload invalid: ${errors.map(e => e.message).join(', ')}` },
});

export const ValidationErrorPayloadMalformed: Payload.error = {
	event: 'error',
	data: { message: 'Payload malformed' },
};
