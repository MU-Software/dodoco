import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DodoCoAPI from '@src/network/api';
import { DodoCoError } from '@src/common/error';
import { SIDEBAR, setSidebarActive } from '@ui/util/sidebar';
import { CanvasTemplate } from '@ui/common/canvasTemplate';
import { PageTemplate } from '@ui/common/pageTemplate';
import { PHButton } from '@ui/common/element/page/muButton';
import { PLHeader2, PLItem2 } from '@ui/common/element/page/pageListItem2';
import { PLHeader3, PLItem3 } from '@ui/common/element/page/pageListItem3';
import { ListRowInputType, ListRowButtonType, ListRow } from '@ui/common/element/page/muListRow';


const ContainerDetail = () => {
  setSidebarActive(SIDEBAR.CONTAINER);

  const params = useParams();
  const fieldNameKoreanMap = {
    name: (k, v) => { return { k: '컨테이너 이름', v: v }; },
    description: (k, v) => { return { k: '컨테이너 설명', v: v }; },
    approved: (k, v) => { isProjectApproved = Boolean(v); return { k: '승인 여부', v: (Boolean(v)) ? '승인됨' : '승인되지 않음' }; },
    created_at_int: (k, v) => { return { k: '컨테이너 생성일', v: (new Date(v * 1000)).toLocaleString('ko-KR') }; },
    start_image_name: (k, v) => { return { k: '컨테이너 이미지', v: v }; },
    // modified_at_int: (k, v) => { return { k: '프로젝트 수정일', v: (new Date(v * 1000)).toLocaleString('ko-KR') }; },
  }

  // setup state
  const [containerData, setContainerData] = useState();

  const fetchData = () => {
    const dodocoAPI = (new DodoCoAPI());
    dodocoAPI.get('containers/' + params.containerId, true).then((responseBody) => {
      if (200 <= responseBody.code && responseBody.code <= 399) {
        let fetchedContainerData = responseBody.data.containers[0];
        let newContainerData = Object.entries(fetchedContainerData).map(([k, v]) => {
          if (k in fieldNameKoreanMap) {
            let result = fieldNameKoreanMap[k](k, v);
            return <ListRow label={result.k}>{result.v}</ListRow>
          }
        });
        newContainerData.push(<ListRow label='프로젝트 이름'>{fetchedContainerData.project.name}</ListRow>);
        newContainerData.push(<ListRow label='컨테이너 생성자 이름'>{fetchedContainerData.created_by.nickname}</ListRow>);
        newContainerData.push(
          <div style={{ width: 100 + '%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 75 + '%', border: '1px solid #ddd' }}>
              <h5 style={{ margin: 4 + 'px', }}>바인딩 된 포트 현황</h5>
              <ListRow header label='컨테이너 내부 포트'>{['프로토콜', '외부 포트']}</ListRow>
              {fetchedContainerData.ports.map(port => <ListRow label={port.container_port}>{[port.protocol, port.exposed_port]}</ListRow>)}
            </div>
          </div>
        )

        console.log(newContainerData);
        setContainerData(newContainerData);
      } else if (responseBody.code === 404) {
        // 해당 컨테이너가 존재하지 않음
        throw new DodoCoError(
          '컨테이너가 존재하지 않습니다.',
          { debugMessage: 'CONTAINER 404 NOT FOUND', });
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
      window.history.pushState({}, '', '/containers');
      window.location.reload();
    });
  }

  useEffect(() => {
    fetchData();
  }, [])

  const navigate = useNavigate();
  const deleteContainer = () => {

    if (confirm('정말 컨테이너를 삭제하실 건가요?\n이 작업은 되돌릴 수 없습니다!')) {
      const dodocoAPI = (new DodoCoAPI());
      dodocoAPI.delete('containers/' + params.containerId, true).then((responseBody) => {
        if (200 <= responseBody.code && responseBody.code <= 399) {
          // 아무것도 하지 않기
          window.history.pushState({}, '', '/containers');
          window.location.reload();
        } else if (responseBody.code === 404) {
          // 해당 컨테이너가 존재하지 않음
          throw new DodoCoError(
            '컨테이너가 존재하지 않습니다.',
            { debugMessage: 'CONTAINER 404 NOT FOUND', });
        } else {
          throw new DodoCoError(
            '알 수 없는 문제가 발생했어요,\n10분 후에 다시 시도해주세요.',
            { debugMessage: `responseBody = ${responseBody}`, });
        }
      }).catch((reason) => {
        window.history.pushState({}, '', '/containers');
        window.location.reload();
      });
    }
  }

  return <CanvasTemplate title={'컨테이너'}>
    <PageTemplate title={'컨테이너 정보'} actionButton={[
      <PHButton onClick={null}>컨테이너 재시작</PHButton>,
      <PHButton onClick={null}>외부 포트 추가</PHButton>,
      <PHButton variant="outline-danger" onClick={deleteContainer}>컨테이너 삭제</PHButton>,
    ]}>
      {(containerData != undefined)
        ? (containerData.length > 0) ? containerData : <div>프로젝트의 정보가 없습니다.</div>
        : <div>컨테이너 정보를 불러오는 중입니다...</div>}
    </PageTemplate>
  </CanvasTemplate>
};

export {
  ContainerDetail
};
