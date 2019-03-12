import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

import {
  detectAllFaces, TinyFaceDetectorOptions, nets, getMediaDimensions, drawLandmarks, drawText, resizeResults,
} from 'face-api.js';
// import { FacesList } from 'components';
import { withHMR } from 'utils/hmr-provider';
import connectProvider from 'utils/redux-provider';
import rootReducer from 'store/reducers';
// import { setFaceDetections } from 'store/faces/actions';
import { setUserDataList } from 'store/userData/actions';

import styles from './styles.pcss';
const cx = classNames.bind(styles);

const isFaceDetectionModelLoaded = () =>
  !!nets.tinyFaceDetector.params &&
  !!nets.faceLandmark68Net.params &&
  !!nets.faceExpressionNet.params;

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
    this.options = new TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
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
      nets.faceExpressionNet.load('/weights');
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

  // getDetectionSnapshot = (detection) => {
  //   const canvas = this.canvasRef.current;
  //   const video = this.videoContainerRef.current;
  //   const { width: fullWidth, height: fullHeight } = getMediaDimensions(video);
  //
  //   const scale = 2;
  //   const width = detection._width * fullWidth * scale;
  //   const height = detection._height * fullHeight * scale;
  //   const x = (detection._x - (scale - 1) * detection._width / 2) * fullWidth;
  //   const y = (detection._y - (scale - 1) * detection._height / 2) * fullHeight;
  //
  //   canvas.width = width;
  //   canvas.height = height;
  //   const context = canvas.getContext('2d');
  //   context.drawImage(video, x, y, width, height, 0, 0, width, height);
  //   const imageData = canvas.toDataURL('image/png');
  //   return imageData.replace(/[^,]*,/, '');
  // };

  // drawDetections(detections) {
  //   const { onChangeDetections } = this.props;

  // onChangeDetections({
  //   detections: detections.map(this.adjustDetectionData),
  //   getDetectionSnapshot: this.getDetectionSnapshot,
  // });
  // }

  loopBack = () => {
    const video = this.videoContainerRef.current;
    if (video.paused || video.ended || !isFaceDetectionModelLoaded()) {
      clearTimeout(this.loopBackTimer);
      this.loopBackTimer = setTimeout(this.loopBack, 40);
      return;
    }
    clearTimeout(this.loopBackTimer);

    const faceDetectionTask = detectAllFaces(video, this.options);
    faceDetectionTask.then((result) => {
      if (result) {
        // this.drawDetections(result);
      }
    }).finally(() => {
      cancelAnimationFrame(this.loopBackTimer);
      this.loopBackTimer = requestAnimationFrame(this.loopBack);
    });


    const canvas = this.overlayCanvasRef.current;
    const faceDetectionExpression = faceDetectionTask.withFaceExpressions();
    const faceDetectionLandmarks = faceDetectionExpression.withFaceLandmarks();

    const { width, height } = getMediaDimensions(video);
    canvas.width = this.state.width;
    canvas.height = this.state.height;

    const overlayTop = (this.state.height - height) / 2;
    const overlayLeft = (this.state.width - width) / 2;
    if (overlayTop !== this.state.overlayLeft && overlayTop !== this.state.overlayTop) {
      this.setState({
        overlayTop,
        overlayLeft,
      });
    }

    faceDetectionLandmarks.then((result) => {
      const context = canvas.getContext('2d');
      document.title = Math.random();
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (result && result.length) {
        // const detections = result.map(item => item.detection);
        const landmarks = resizeResults(result, { width: this.state.width, height: this.state.height })
          .map(item => item.landmarks);
        drawLandmarks(canvas, landmarks, { drawLines: true });
        result.forEach((item) => {
          const { x, y, width, height } = item.alignedRect.box;
          const score = Math.round(item.detection.score * 100) / 100;
          const { probability, expression } = item.expressions
            .map(expr => (expr.expression === 'neutral' ? ({
              ...expr,
              probability: expr.probability * 0.01,
            }) : expr))
            .reduce((best, expr) => (expr.probability > best.probability ? expr : best));
          drawText(context, x + width, y, `${score} ${expression}`);
        });
      }
    }).finally(() => {
      cancelAnimationFrame(this.loopBackTimer);
      this.loopBackTimer = setTimeout(this.loopBack, 40);
    });
  };

  render() {
    const {
      width, height,
      overlayLeft, overlayTop,
    } = this.state;
    console.log('render');
    return (
      <div className={cx('videoContainer')}>
        <video // eslint-disable-line jsx-a11y/media-has-caption
          className={cx('video')}
          onPlay={this.loopBack}
          ref={this.videoContainerRef}
          autoPlay
          muted
          width={width - overlayLeft * 2} height={height - overlayTop * 2}
        />
        {/* <FacesList className={cx('overlay')} /> */}
        {/* <canvas className={cx('canvas')} ref={this.canvasRef} /> */}
        <canvas
          className={cx('overlay')}
          ref={this.overlayCanvasRef}
          style={{
            width: `${width - overlayLeft * 2}px`,
            height: `${height - overlayTop * 2}px`,
          }}
        />
      </div>
    );
  }
}

WebCamPageLayout.propTypes = {
  // onChangeDetections: PropTypes.func,
  onUserDataChange: PropTypes.func,
};

const mapDispatchToProps = ({
  // onChangeDetections: setFaceDetections,
  onUserDataChange: setUserDataList,
});

const WebCamPage = connect(null, mapDispatchToProps)(WebCamPageLayout);

export default withHMR(module)(connectProvider(rootReducer)(WebCamPage));
