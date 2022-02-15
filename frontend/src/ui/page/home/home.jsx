import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { ListRowInputType, ListRowButtonType, ListRow } from '@ui/common/element/page/muListRow';


const DodoCoHome = () => {
  setSidebarActive(SIDEBAR.HOME);

  const navigate = useNavigate();
  const goToProjectList = () => navigate('/projects');
  const goToContainerList = () => navigate('/containers');

  const [demoData, setDemoData] = useState({
    demoStr: '',
    demoNumeric: 0,
    demoChecked: true,
    demoRadio: undefined,
  });
  const onInputChange = (valueName) => (e) => {
    if (e.target.type === 'reset') {
      setDemoData({
        demoStr: '',
        demoNumeric: 0,
        demoChecked: true,
        demoRadio: undefined,
      });
    } if (valueName) {
      let newDemoData = { ...demoData };
      // TODO: e.target.checked도 받을 수 있도록
      if (e.target.type === 'checkbox') {
        newDemoData[valueName] = e.target.checked;
      } else {
        newDemoData[valueName] = e.target.value;
      }
      console.log(newDemoData);
      setDemoData(newDemoData);
    }
  }





  return <CanvasTemplate title={'프로젝트 홈'}>
    <PageTemplate title={'현재 참여 중인 프로젝트'} actionButton={[
      <PHButton smaller onClick={goToProjectList}>자세히 보기</PHButton>
    ]}>
      <ListRow header>{['테스트1', <div>qweqwe</div>]}</ListRow>
      <ListRow noLabel>{['테스트1', 213124]}</ListRow>
      <ListRow label='1'>{['테스트1', null]}</ListRow>
      <ListRow label='1'>
        {[
          '테스트1',
          ListRowInputType.n({ name: 'demoStr', placeholder: 'Place홀더', onChange: onInputChange, state: demoData }),
          ListRowInputType.n({ name: 'demoChecked', type: 'checkbox', placeholder: 'Place홀더', onChange: onInputChange, state: demoData }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:value:1',
          ListRowInputType.n({ name: 'demoRadio', type: 'radio', onChange: onInputChange, state: demoData, radioValue: 1 }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:value:2',
          ListRowInputType.n({ name: 'demoRadio', type: 'radio', onChange: onInputChange, state: demoData, radioValue: 2 }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:number',
          ListRowInputType.n({ name: 'demoNumeric', type: 'number', onChange: onInputChange, state: demoData, min: 5, max: 15, step: 2, }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:button',
          ListRowInputType.n({ innerValue: 'qwe', type: 'reset', onChange: onInputChange }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:button',
          ListRowInputType.n({ innerValue: 'qwe', type: 'button', size: 'lt', variant: 'secondary', onChange: onInputChange }),
        ]}
      </ListRow>
      <ListRow label='1'>
        {[
          '테스트:button',
          ListRowInputType.n({ innerValue: 'qwe', type: 'button', size: 'sm', variant: 'success', onChange: onInputChange }),
        ]}
      </ListRow>
      <ListRow label='1' itemWidth={[10, 80, 10]}>
        {[
          '테스트:button',
          ListRowInputType.n({ innerValue: 'qwe', type: 'button', size: 'extra-sm', variant: 'danger', onChange: onInputChange }),
        ]}
      </ListRow>
    </PageTemplate>

    <PageTemplate title={'접근 가능한 컨테이너'} actionButton={[
      <PHButton smaller onClick={goToContainerList}>+ 자세히 보기</PHButton>
    ]}>
    </PageTemplate>
  </CanvasTemplate>
};

export {
  DodoCoHome
};
