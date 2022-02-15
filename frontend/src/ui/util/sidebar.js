const gotoMenu = (suburl) => {
  // Go to route
  window.history.pushState({}, '', suburl);

  // Remove all tooltip
  for (var tooltipElement of document.getElementsByClassName('tooltip'))
    tooltipElement.remove();
};

const SIDEBAR = {
  HOME: {targetId: 'sidebarHomeBtn', route: '/'},
  PROJECT: {targetId: 'sidebarProjectBtn', route: '/projects'},
  CONTAINER: {targetId: 'sidebarContainerBtn', route: '/containers'},
};

const SIDEBAR_ELEMENT = Object.entries(SIDEBAR).map(([k, v]) => {
  var sElement = document.getElementById(v.targetId);
  sElement.addEventListener('click', () => gotoMenu(v.route));
  return sElement;
});

function setSidebarActive(sidebarId) {
  SIDEBAR_ELEMENT.forEach(e => {
    if (e.id === sidebarId.targetId) {
      if (!e.classList.contains('active'))
        e.classList.add('active');
    } else {
      if (e.classList.contains('active'))
        e.classList.remove('active');
    }
  });
}

export { SIDEBAR, SIDEBAR_ELEMENT, setSidebarActive };
