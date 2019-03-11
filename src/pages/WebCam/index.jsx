import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

import {
  detectAllFaces, TinyFaceDetectorOptions, nets, getMediaDimensions,
  // detectSingleFace, drawLandmarks,
} from 'face-api.js';
import { FacesList } from 'components';
import { withHMR } from 'utils/hmr-provider';
import connectProvider from 'utils/redux-provider';
import rootReducer from 'store/reducers';
import { setFaceDetections } from 'store/faces/actions';
import { setUserDataList } from 'store/userData/actions';

import styles from './styles.pcss';
const cx = classNames.bind(styles);

const isFaceDetectionModelLoaded = () => !!nets.tinyFaceDetector.params && !!nets.faceLandmark68Net.params;

// const isSmartScreen = window.innerWidth > 3000 ? 2048 : 1024;


class WebCamPageLayout extends Component {
  constructor(props) {
    super(props);
    this.videoContainerRef = React.createRef();
    this.canvasRef = React.createRef();
    this.overlayCanvasRef = React.createRef();
    this.loopBackTimer = null;
    this.state = {
      width: 640,
      height: 480,
    };
    this.options = new TinyFaceDetectorOptions({ inputSize: 1024, scoreThreshold: 0.15 });
    this.context = null;
  }

  componentDidMount() {
    const { onUserDataChange } = this.props;
    window.socket = window.io();
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    if (!isFaceDetectionModelLoaded()) {
      nets.tinyFaceDetector.load('/weights');
      nets.faceLandmark68Net.load('/weights');
    }

    window.socket.on('dataChange', ({ uuids, list, profiles, headers, scores }) => {
      onUserDataChange({ uuids, list, profiles, headers, scores });
    });
  }

  handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.setState({ width, height });
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width,
        height,
      },
    }).then((stream) => {
      this.videoContainerRef.current.srcObject = null;
      this.videoContainerRef.current.srcObject = stream;
    });
  };

  adjustDetectionData = (detection) => {
    const video = this.videoContainerRef.current;
    const { score, relativeBox: { _x, _y, _width, _height } } = detection;

    const { width: fullWidth, height: fullHeight } = getMediaDimensions(video);
    const width = _width * fullWidth;
    const height = _height * fullHeight;

    const scale = 1;

    const size = Math.max(height, width) * scale;
    const _size = Math.max(_width, _height) * scale;

    const _dX = _size - _height;
    const _dY = _size - _width;
    return {
      score,
      /* x, y, width, height are circle sizes */
      x: _x - _dX / 2,
      y: _y - _dY / 2,
      width: _width, // + _dX * _width ,
      height: _height, //  + _dY * _height,
      size,
      /* while underscore params are raw values */
      _x,
      _y,
      _width,
      _height,
      _size,
    };
  };

  getDetectionSnapshot = (detection) => {
    const canvas = this.canvasRef.current;
    const video = this.videoContainerRef.current;
    const { width: fullWidth, height: fullHeight } = getMediaDimensions(video);


    const scale = 2;
    const width = detection._width * fullWidth * scale;
    const height = detection._height * fullHeight * scale;
    const x = (detection._x - (scale - 1) * detection._width / 2) * fullWidth;
    const y = (detection._y - (scale - 1) * detection._height / 2) * fullHeight;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(video, x, y, width, height, 0, 0, width, height);
    const imageData = canvas.toDataURL('image/png');
    return imageData.replace(/[^,]*,/, '');
  };

  drawDetections(detections) {
    const { onChangeDetections } = this.props;

    onChangeDetections({
      detections: detections.map(this.adjustDetectionData),
      getDetectionSnapshot: this.getDetectionSnapshot,
    });
  }

  loopBack = () => {
    const video = this.videoContainerRef.current;
    if (video.paused || video.ended || !isFaceDetectionModelLoaded()) {
      clearTimeout(this.loopBackTimer);
      this.loopBackTimer = setTimeout(this.loopBack, 40);
      return;
    }

    const faceDetectionTask = detectAllFaces(video, this.options);
    faceDetectionTask.then((result) => {
      if (result) {
        this.drawDetections(result);
      }
    }).finally(() => {
      cancelAnimationFrame(this.loopBackTimer);
      this.loopBackTimer = requestAnimationFrame(this.loopBack);
    });


    // const canvas = this.overlayCanvasRef.current;
    // const faceDetectionLandmarks = faceDetectionTask.withFaceLandmarks();
    //
    // const { width, height } = getMediaDimensions(video);
    // canvas.width = this.state.width;
    // canvas.height = this.state.height;
    //
    // this.setState({
    //   overlayTop: (this.state.height - height) / 2,
    //   overlayLeft: (this.state.width - width) / 2,
    // });
    //
    // faceDetectionLandmarks.then((result) => {
    //   if (result) {
    //     const detections = result.map(item => item.detection);
    //     const landmarks = result.map(item => item.landmarks);
    //     console.log(result);
    //     this.drawDetections(detections);
    //     drawLandmarks(canvas, landmarks, { drawLines: true, showScore: true });
    //     // result.forEach(({ detection, faceLandmarks }) => {
    //     // });
    //     console.log(faceDetectionTask);
    //   }
    // }).finally(() => {
    //   cancelAnimationFrame(this.loopBackTimer);
    //   this.loopBackTimer = setTimeout(this.loopBack, 40);
    // });
  };

  render() {
    const {
      width, height,
      // overlayLeft, overlayTop,
    } = this.state;
    return (
      <div className={cx('videoContainer')}>
        <video // eslint-disable-line jsx-a11y/media-has-caption
          className={cx('video')}
          onPlay={this.loopBack}
          ref={this.videoContainerRef}
          autoPlay
          muted
          width={width} height={height}
        />
        <FacesList className={cx('overlay')} />
        <canvas className={cx('canvas')} ref={this.canvasRef} />
        {/*
        <canvas className={cx('overlay')} ref={this.overlayCanvasRef} style={{ left: overlayLeft, top: overlayTop }} />
        */}
      </div>
    );
  }
}

WebCamPageLayout.propTypes = {
  onChangeDetections: PropTypes.func,
  onUserDataChange: PropTypes.func,
};

const mapDispatchToProps = ({
  onChangeDetections: setFaceDetections,
  onUserDataChange: setUserDataList,
});

const WebCamPage = connect(null, mapDispatchToProps)(WebCamPageLayout);

export default withHMR(module)(connectProvider(rootReducer)(WebCamPage));
