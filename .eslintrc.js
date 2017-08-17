module.exports = {
	'env': {
        'browser':  true,
        'commonjs': true,
        'es6':      true
    },

    'parserOptions': {
    	'ecmaVersion'  : 8,
        'ecmaFeatures': {
            'jsx': true
        },
        'sourceType': 'module'
    },

    'globals': {
        '__dirname': true,
        'process':   true,
        '$':         true
    },

    'plugins': [],

    'rules': {
        'indent': [
            'warn',
            'tab'
        ],
        'linebreak-style': [
            'warn',
            'unix'
        ],
        'quotes': [
            'warn',
            'single'
        ],
        'semi': [
            'warn',
            'never'
        ]
    }
}
