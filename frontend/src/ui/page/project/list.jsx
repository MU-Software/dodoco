import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiLocationEnter } from '@mdi/js';
import { useNavigate } from 'react-router-dom';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { ListRowInputType, ListRowButtonType, ListRow } from '@ui/common/element/page/muListRow';


const ProjectListItem = (props) => {
  const itemData = props.itemData;
  const linkJSX = (Element) => {
    if (itemData.id)
      return <Link to={`/projects/${itemData.id}`}>{Element}</Link>
    else
      return <div>{Element}</div>
  }
  return linkJSX(
    <li className="list-group-item">
      <div>{itemData.name}</div>
      <div>{itemData.containers !== undefined && itemData.containers.length ? `컨테이너 ${itemData.containers.length}개` : ''}</div>
      <div>{itemData.team !== undefined ? itemData.team.name + '팀' : ''}</div>
      {itemData.id ? <Icon path={mdiLocationEnter} size={1.5 + 'rem'} /> : ''}
    </li>
  );
}

const ProjectList = () => {
  setSidebarActive(SIDEBAR.PROJECT);

  // setup state
  const [projectList, setProjectList] = useState();

  const fetchData = () => {
    const dodocoAPI = (new DodoCoAPI());
    /** @type {Promise<Response>} */
    dodocoAPI.get('projects/', true).then((responseBody) => {
      // 409, 410, 422 불가능
      if (200 <= responseBody.code && responseBody.code <= 399) {
        let newProjectList = responseBody.data.projects.map(proj => {
          let projectName = proj.name;
          if (!proj.approved) projectName += ' (승인되지 않음)';
          let projectContainers = proj.containers || []
          let projectContainerStat = `${projectContainers.length} / ${proj.max_container_limit}`

          return <Link to={`/projects/${proj.uuid}`}>
            <ListRow>{[projectName, projectContainerStat]}</ListRow>
          </Link>
        });

        setProjectList(newProjectList);
      } else if (responseBody.code === 404) {
        // 현재 참여 중인 프로젝트가 없음
        setProjectList([]);
      } else {
        throw new DodoCoError(
          '알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.',
          { debugMessage: `responseBody = ${responseBody}`, });
      }
    }).catch((reason) => {
      console.log(reason);
      if (typeof (reason) === 'object' && reason.constructor.name === 'DodoCoError') {
        alert(reason.message);
      } else {
        alert('알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.');
      }
      setProjectList([]);
    });
  }

  useEffect(() => {
    fetchData();
  }, [])

  const navigate = useNavigate();
  const goToCreateProject = () => navigate('/projects/create');

  return <CanvasTemplate title={'프로젝트'}>
    <PageTemplate title={'현재 참여 중인 프로젝트'} actionButton={[
      <PHButton onClick={goToCreateProject}>새 프로젝트 만들기</PHButton>
    ]}>
      <ListRow header >{['프로젝트 이름', '컨테이너 개수']}</ListRow>
      {(projectList != undefined)
        ? (projectList.length > 0) ? projectList : <div>현재 참여 중인 프로젝트가 없습니다.</div>
        : <div>프로젝트 목록을 불러오는 중입니다...</div>
      }
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ProjectList
};
