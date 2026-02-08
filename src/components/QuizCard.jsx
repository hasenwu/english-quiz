import React, { useState, useEffect } from 'react';

const QuizCard = ({ wordsData, onWrongWordsUpdate }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [wrongWords, setWrongWords] = useState([]);

  useEffect(() => {
    if (wordsData && wordsData.length > 0) {
      generateNewQuestion();
    }
  }, [wordsData]);

  const generateNewQuestion = () => {
    // 优先从错题列表中选择题目
    const wordPool = wrongWords.length > 0 ? wrongWords : wordsData;
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    const word = wordPool[randomIndex];
    
    // 生成干扰项
    const otherWords = wordsData.filter(w => w.word !== word.word);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map(w => w.meaning);
    
    // 合并选项并打乱顺序
    const allOptions = [word.meaning, ...distractors];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    
    setCurrentWord(word);
    setOptions(shuffledOptions);
    setSelectedOption(null);
    setAnswered(false);
  };

  const handleOptionClick = (option) => {
    if (!answered) {
      setSelectedOption(option);
      setAnswered(true);
      
      // 处理错题记录
      if (option !== currentWord.meaning) {
        // 回答错误，添加到错题列表（如果不存在）
        if (!wrongWords.some(w => w.word === currentWord.word)) {
          const newWrongWords = [...wrongWords, currentWord];
          setWrongWords(newWrongWords);
          onWrongWordsUpdate && onWrongWordsUpdate(newWrongWords);
        }
      } else {
        // 回答正确，从错题列表中移除
        const newWrongWords = wrongWords.filter(w => w.word !== currentWord.word);
        setWrongWords(newWrongWords);
        onWrongWordsUpdate && onWrongWordsUpdate(newWrongWords);
      }
      
      // 0.7秒后自动进入下一题
      setTimeout(generateNewQuestion, 700);
    }
  };

  const getOptionStyle = (option) => {
    if (!answered) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
        textAlign: 'center'
      };
    }
    
    if (option === currentWord.meaning) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#4CAF50',
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'center'
      };
    } else if (option === selectedOption) {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#FFCDD2',
        cursor: 'pointer',
        textAlign: 'center'
      };
    } else {
      return {
        display: 'block',
        margin: '10px auto',
        width: '200px',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#fff',
        cursor: 'pointer',
        textAlign: 'center',
        opacity: '0.7'
      };
    }
  };

  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ fontSize: '32px', marginBottom: '30px' }}>
        {currentWord.word}
      </h2>
      <div>
        {options.map((option, index) => (
          <button
            key={index}
            style={getOptionStyle(option)}
            onClick={() => handleOptionClick(option)}
            disabled={answered}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizCard;