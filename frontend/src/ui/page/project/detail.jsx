import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { ListRowLongTextType, L, ListRowInputType, ListRowButtonType, ListRow } from '@ui/common/element/page/muListRow';

const defaultItemWidth = [30, 60];

const ProjectDetail = () => {
  setSidebarActive(SIDEBAR.PROJECT);

  const navigate = useNavigate();
  const goToContainerCreation = () => navigate(`/projects/${params.projectId}/create-container`);
  const deleteProject = () => {
    if (confirm('정말 프로젝트를 삭제하실 건가요?')) {
      const dodocoAPI = (new DodoCoAPI());
      dodocoAPI.delete('projects/' + (params.projectId || ''), true).then((responseBody) => {
        if (200 <= responseBody.code && responseBody.code <= 399) {
          // 아무것도 하지 않기
          window.history.pushState({}, '', '/projects');
          window.location.reload();
        } else if (responseBody.code === 404) {
          // 해당 프로젝트가 존재하지 않음
          throw new DodoCoError(
            '프로젝트가 존재하지 않습니다.',
            { debugMessage: 'PROJECT 404 NOT FOUND', });
        } else {
          throw new DodoCoError(
            '알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.',
            { debugMessage: `responseBody = ${responseBody}`, });
        }
      }).catch((reason) => {
        window.history.pushState({}, '', '/projects');
        window.location.reload();
      });
    }
  }

  // setup state
  const [projectData, setProjectData] = useState();
  const [actionButtons, setActionButtons] = useState([
    <PHButton variant="outline-danger" onClick={deleteProject}>프로젝트 삭제</PHButton>
  ]);

  const params = useParams();
  const fieldNameKoreanMap = {
    name: (k, v) => { return { k: '프로젝트 이름', v: v }; },
    description: (k, v) => { return { k: '프로젝트 설명', v: v }; },
    tag: (k, v) => { return { k: '태그', v: `${v.name} [${v.code}]` }; },
    approved: (k, v) => { return { k: '승인 여부', v: (Boolean(v)) ? '승인됨' : '승인되지 않음' }; },
    created_at_int: (k, v) => { return { k: '프로젝트 생성일', v: (new Date(v * 1000)).toLocaleString('ko-KR') }; },
    // modified_at_int: (k, v) => { return { k: '프로젝트 수정일', v: (new Date(v * 1000)).toLocaleString('ko-KR') }; },
  }

  const fetchData = () => {
    const dodocoAPI = (new DodoCoAPI());
    dodocoAPI.get('projects/' + params.projectId, true).then((responseBody) => {
      if (200 <= responseBody.code && responseBody.code <= 399) {
        let fetchedProjectData = responseBody.data.projects[0];
        let newProjectData = Object.entries(fetchedProjectData).map(([k, v]) => {
          if (k in fieldNameKoreanMap) {
            let result = fieldNameKoreanMap[k](k, v);
            return <ListRow itemWidth={defaultItemWidth} label={result.k}>{(k === 'description') ? new L(result.v) : result.v}</ListRow>
          }
        });
        let projectContainers = fetchedProjectData.containers || [];
        let projectContainerStatus = `${projectContainers.length} / ${fetchedProjectData.max_container_limit}`
        if (projectContainers.length < fetchedProjectData.max_container_limit && fetchedProjectData.approved) {
          setActionButtons([<PHButton onClick={goToContainerCreation}>컨테이너 생성</PHButton>, ...actionButtons,]);
        }
        newProjectData.push(<ListRow itemWidth={defaultItemWidth} label='컨테이너 현황'>{projectContainerStatus}</ListRow>)

        setProjectData(newProjectData);
      } else if (responseBody.code === 404) {
        // 해당 프로젝트가 존재하지 않음
        throw new DodoCoError(
          '프로젝트가 존재하지 않습니다.',
          { debugMessage: 'PROJECT 404 NOT FOUND', });
      } else {
        throw new DodoCoError(
          '알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.',
          { debugMessage: `responseBody = ${responseBody}`, });
      }
    }).catch((reason) => {
      if (typeof (reason) === 'object' && reason.constructor.name === 'DodoCoError') {
        alert(reason.message);
      } else {
        console.log(reason);
        alert('알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.');
      }
      window.history.pushState({}, '', '/projects');
      window.location.reload();
    });
  }

  useEffect(() => fetchData(), [])

  return <CanvasTemplate title={'프로젝트'}>
    <PageTemplate title={'프로젝트 상세'} actionButton={actionButtons}>
      {(projectData != undefined)
        ? (projectData.length > 0) ? projectData : <div>프로젝트의 정보가 없습니다.</div>
        : <div>프로젝트 정보를 불러오는 중입니다...</div>}
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ProjectDetail
};
