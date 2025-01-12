let UIkit: any;

if (typeof window !== 'undefined') {
  UIkit = require('uikit');
  const Icons = require('uikit/dist/js/uikit-icons');
  // Load UIkit icons
  UIkit.use(Icons);
}

export default UIkit;
