'use strict';

import DodoCoAPI from './network/api';
const dodoCoAPI = (new DodoCoAPI());

// Topbar hooker & initializer
const topbarUserNameIndicator = document.getElementById('dropdown07XL');
const topbarSignoutBtn = document.getElementById('topbarSignoutBtn');
topbarSignoutBtn.addEventListener('click', () => dodoCoAPI.signout(), false);

// const topbarHierarchyIndicator = document.getElementById('topbarHierarchyIndicator');
// const hierarchyIndicatorContent = (roles) => {
//   var newElement = document.createElement('li');
//   newElement.className = 'nav-item'
//   var newElementChild = document.createElement('a');
//   newElementChild.className = 'nav-link';
//   // newElementChild.href = '#';

//   for(const role of roles) {
//     if (role.type === 'professor' && role.chairman)
//       newElementChild.innerText = '학부장';
//     else if (role.type === 'professor')
//       newElementChild.innerText = '교수';
//     else if (role.type === 'student')
//       newElementChild.innerText = '학부생';
//     else
//       newElementChild.innerText = '손님';
//   }
//   newElement.appendChild(newElementChild);
//   return newElement
// };


dodoCoAPI.refreshAuthentications().then(
  (_) => {
    let userID = dodoCoAPI.userID;
    if (userID !== undefined || userID !== null) {
      topbarUserNameIndicator.innerText = userID + '님 환영합니다 ';
    } else { topbarUserNameIndicator.innerText = '사용자 옵션 '; }

    // var roles = dodoCoAPI.roles;
    // let hierarchy = hierarchyIndicatorContent(roles);
    // topbarHierarchyIndicator.insertBefore(hierarchy, topbarHierarchyIndicator.firstChild);
  }
);

import './App.css';
import { Routes, Route } from 'react-router-dom';

import { DodoCoHome } from './ui/page/home/home';
import { ProjectList } from './ui/page/project/list';
import { ProjectDetail } from './ui/page/project/detail';
import { ProjectCreation } from './ui/page/project/create-project';
import { ContainerCreation } from './ui/page/project/create-container';
import { ContainerList } from './ui/page/container/list';
import { ContainerDetail } from './ui/page/container/detail';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<DodoCoHome />} exact />
        <Route exact path="/projects" element={<ProjectList />} exact />
        <Route exact path="/projects/create" element={<ProjectCreation />} exact />
        <Route exact path="/projects/:projectId" element={<ProjectDetail />} exact />
        <Route exact path="/projects/:projectId/create-container" element={<ContainerCreation />} exact />
        <Route exact path="/containers" element={<ContainerList />} exact />
        <Route exact path="/containers/:containerId" element={<ContainerDetail />} exact />
      </Routes>
    </div>
  );
}

export default App;
