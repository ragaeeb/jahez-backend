export const Types = {
    Array: 'array',
    Integer: 'integer',
    Object: 'object',
    Text: 'string',
};

export const DecimalText = {
    type: Types.Text,
    pattern: '^[+-]?([0-9]*[.])?[0-9]+$',
};

export default Types;
