import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { PLHeader2, PLItem2, PLInput2 } from '@ui/common/element/page/pageListItem2';
import { Button } from 'react-bootstrap';
import { PLSelect2 } from '@ui/common/element/page/pageListItem2';

const ProjectCreation = () => {
  setSidebarActive(SIDEBAR.PROJECT);
  const navigate = useNavigate();
  const goToList = () => navigate('/projects');

  const createProjectAPI = (data) => {
    const dodocoAPI = (new DodoCoAPI());
    /** @type {Promise<Response>} */
    dodocoAPI.post('projects/', data, true).then((responseBody) => {
      // 409, 410, 422 불가능
      if (200 <= responseBody.code && responseBody.code <= 399) {
        goToList();
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
      goToList();
    });
  }

  // setup state
  const [tagList, setTagList] = useState();
  const [projectData, setNewProjectData] = useState({
    name: '',
    description: '',
    tag_code: '',
  });
  const onInputChange = (valueName) => (e) => {
    let newProjectData = { ...projectData };
    newProjectData[valueName] = e.target.value;
    setNewProjectData(newProjectData)
  }
  const onSubmit = (e) => {
    const inputNameLabelMap = {
      name: '프로젝트의 이름을 적어주세요!',
      description: '프로젝트의 설명을 적어주세요!',
      tag_code: '태그를 선택해주세요!',
    }
    let allFieldFilled = true;
    Object.entries(projectData).map(([k, v]) => {
      if (allFieldFilled && !(!!v && !!(v.trim()))) {
        allFieldFilled = false;
        alert(inputNameLabelMap[k]);
      }
    });

    if (allFieldFilled) {
      createProjectAPI(projectData);
    }
  };

  const fetchData = () => {
    const dodocoAPI = (new DodoCoAPI());
    dodocoAPI.get('tags/', false).then((responseBody) => {
      if (200 <= responseBody.code && responseBody.code <= 399) {
        let fetchedTags = responseBody.data.tags;
        let newTagList = fetchedTags.map(tag => <option value={tag.code}>{tag.name}</option>);
        setTagList(newTagList);
        setNewProjectData({ ...projectData, tag_code: fetchedTags[0].code, })
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
        alert('알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.');
      }
      window.history.pushState({}, '', '/projects');
      window.location.reload();
    });
  }

  useEffect(() => {
    fetchData();
  }, [])

  return <CanvasTemplate title={'프로젝트'}>
    <PageTemplate title={'새 프로젝트 만들기'} actionButton={[
      <PHButton variant="primary" onClick={onSubmit} >프로젝트 생성</PHButton>
    ]}
    >
      <PLInput2 name={'프로젝트 이름'} state={projectData} valueName={'name'} onChange={onInputChange} />
      <PLInput2 name={'프로젝트 설명'} state={projectData} valueName={'description'} onChange={onInputChange} />
      <PLSelect2 name={'태그'} state={projectData} valueName={'tag_code'} onChange={onInputChange}>
        {tagList}
      </PLSelect2>
      <br />
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ProjectCreation
};
