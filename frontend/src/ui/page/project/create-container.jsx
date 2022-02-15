import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { PLHeader2, PLItem2, PLInput2, PLSelect2 } from '@ui/common/element/page/pageListItem2';
import { ListRowInputType, ListRow } from '@src/ui/common/element/page/muListRow';

const defaultItemWidth = [30, 60];

const ContainerCreation = () => {
  setSidebarActive(SIDEBAR.PROJECT);

  const params = useParams();

  // setup state
  const [containerData, setNewProjectData] = useState({
    projectName: '',
    name: '',
    description: '',
    image_name: 'ubuntu',
    accountId: '',
    accountPassword: '',
  });
  const onInputChange = (valueName) => (e) => {
    let newContainerData = { ...containerData };
    newContainerData[valueName] = e.target.value;
    setNewProjectData(newContainerData)
  }
  const onSubmit = (e) => {
    const inputNameLabelMap = {
      projectName: '프로젝트의 이름이 비어있습니다!',
      name: '컨테이너의 이름을 적어주세요!',
      description: '컨테이너의 설명을 적어주세요!',
      image_name: '컨테이너의 기반이 될 이미지를 선택해주세요!',
      accountId: '컨테이너 OS에서 사용될 ID를 적어주세요!',
      accountPassword: '컨테이너 OS에서 사용될 비밀번호를 적어주세요!',
    }
    let allFieldFilled = true;
    Object.entries(containerData).map(([k, v]) => {
      if (allFieldFilled && !(!!v && !!(v.trim()))) {
        allFieldFilled = false;
        alert(inputNameLabelMap[k]);
      }
    });

    if (allFieldFilled) {
      const dodocoAPI = (new DodoCoAPI());
      dodocoAPI.post('projects/' + params.projectId + '/create-container', containerData, true).then((responseBody) => {
        if (200 <= responseBody.code && responseBody.code <= 399) {
          window.history.pushState({}, '', '/containers');
          window.location.reload();
        } else if (responseBody.code === 404) {
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
          alert('알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.');
        }
      });
    }
  };

  const fetchProjectName = () => {
    const dodocoAPI = (new DodoCoAPI());
    /** @type {Promise<Response>} */
    dodocoAPI.get('projects/' + params.projectId, true).then((responseBody) => {
      // 409, 410, 422 불가능
      if (200 <= responseBody.code && responseBody.code <= 399) {
        let fetchedProjectData = responseBody.data.projects[0];
        setNewProjectData({ ...containerData, projectName: fetchedProjectData.name });
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
      window.history.pushState({}, '', '/projects');
      window.location.reload();
    });
  }

  useEffect(() => {
    fetchProjectName();
  }, []);

  const targetField = [
    { label: '프로젝트 이름', inputField: ListRowInputType.n({ name: 'projectName', state: containerData, onChange: onInputChange, disabled: true }) },
    { label: '컨테이너 이름', inputField: ListRowInputType.n({ name: 'name', state: containerData, onChange: onInputChange }) },
    { label: '컨테이너 설명', inputField: ListRowInputType.n({ name: 'description', state: containerData, type: 'textarea', onChange: onInputChange }) },
    { label: '타겟 이미지', inputField: ListRowInputType.n({ name: 'image_name', state: containerData, type: 'select', onChange: onInputChange, value: ['ubuntu',], innerValue: ['Ubuntu',], disabled: true }) },
  ]

  return <CanvasTemplate title={'프로젝트'}>
    <PageTemplate title={'새 컨테이너 시작하기'} actionButton={[
      <PHButton variant="primary" onClick={onSubmit} >컨테이너 생성</PHButton>
    ]}>
      {targetField.map((o, i, a) => <ListRow label={o.label} itemWidth={defaultItemWidth}>{o.inputField}</ListRow>)}
      <br />
      <fieldset>
        <legend>추가 설정</legend>
        <PLInput2 name={'계정 이름'} state={containerData} valueName={'accountId'} onChange={onInputChange} />
        <PLInput2 name={'계정 비밀번호'} state={containerData} valueName={'accountPassword'} onChange={onInputChange} />
      </fieldset>
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ContainerCreation
};
