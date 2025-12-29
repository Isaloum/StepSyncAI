#!/usr/bin/env python3
"""
Insert Test #5 questions into awsprepai-multicert.html
"""
import json
import re

# Read the Python script with Test #5 questions
with open('add_questions.py', 'r') as f:
    content = f.read()

# Extract the test5_questions array
# Find the array content between test5_questions = [ and the next ]
match = re.search(r'test5_questions = \[(.*?)\n\]', content, re.DOTALL)
if not match:
    print("Could not find test5_questions array")
    exit(1)

array_content = match.group(1)

# Parse each question object
# They're formatted as Python dicts with double quotes
questions = []
# Split by },\n    { to separate questions
question_strings = re.split(r'\},\s*\n\s*\{', array_content.strip())

for i, q_str in enumerate(question_strings):
    # Clean up the string
    q_str = q_str.strip()
    if not q_str.startswith('{'):
        q_str = '{' + q_str
    if not q_str.endswith('}'):
        q_str = q_str + '}'

    # Convert Python dict string to actual dict
    try:
        # Use eval to parse the dict (safe since we control the source)
        q_dict = eval(q_str)
        questions.append(q_dict)
    except Exception as e:
        print(f"Error parsing question {i+1}: {e}")
        print(f"String: {q_str[:200]}")

print(f"Parsed {len(questions)} questions from Test #5")

# Convert to JavaScript format
js_questions = []
for q in questions:
    # Handle answer field - might be int or list
    answer_str = json.dumps(q['answer']) if isinstance(q['answer'], list) else str(q['answer'])

    # Escape quotes in strings for JavaScript
    cat = q['cat'].replace('"', '\\"')
    question_text = q['q'].replace('"', '\\"')
    explain_text = q['explain'].replace('"', '\\"')
    options = json.dumps(q['options'])  # Use JSON for array

    js_q = f'      {{ cat: "{cat}", q: "{question_text}", options: {options}, answer: {answer_str}, explain: "{explain_text}" }}'
    js_questions.append(js_q)

# Read the HTML file
with open('awsprepai-multicert.html', 'r') as f:
    html_lines = f.readlines()

# Find line 774 (index 773) where we need to insert
insert_line = 773  # Before the ];

# Insert the new questions
new_questions_text = ',\n'.join(js_questions) + ',\n'
html_lines.insert(insert_line, new_questions_text)

# Write back
with open('awsprepai-multicert.html', 'w') as f:
    f.writelines(html_lines)

print(f"Successfully added {len(questions)} questions from Test #5 to awsprepai-multicert.html")
print(f"New total SAA questions: {422 + len(questions)}")
