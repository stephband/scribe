/**
shim.js
Provides minimal browser environment shims for Node/Deno execution.
**/

// Create a minimal window object if it doesn't exist
if (typeof window === 'undefined') {
    globalThis.window = {
        DEBUG: false,
        location: {
            origin: '',
            pathname: '',
            href: ''
        }
    };
}

// Create document stub if needed
if (typeof document === 'undefined') {
    globalThis.document = {};
}
