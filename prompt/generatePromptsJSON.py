import json
import sys
import os

END_MARK = "EOF"
FILENAME = "prompts.json"
FILENAME_NEW = "validJSON.json"

def load_records(filename):
    """
    尝试从 filename 中加载记录：
    1. 如果文件不存在，则返回空列表，并使用原文件名进行保存。
    2. 如果文件内容为空，则返回空列表，使用原文件名进行保存。
    3. 如果文件内容为 JSON 数组，则返回其中的列表数据，用原文件名保存。
    4. 如果文件内容为合法 JSON 但不是 JSON 数组，或者是无效 JSON，则返回空列表，至于输入的数据将保存至 FILENAME_NEW。
    """
    target_filename = filename
    if not os.path.exists(filename):
        return [], target_filename

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            if not content.strip():
                return [], target_filename

        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data, target_filename
            else:
                print(f"注意: {filename} 不包含 JSON 数组，将创建一个新的文件 {FILENAME_NEW} 来暂存输入，以免覆写原文件")
                target_filename = FILENAME_NEW
                return [], target_filename

    except json.JSONDecodeError:
        print(f"注意: {filename} 的内容不是合法 JSON，将创建一个新的文件 {FILENAME_NEW} 来暂存输入，以免覆写原文件")
        target_filename = FILENAME_NEW
        return [], target_filename
    except Exception as e:
        print(f"错误: 文件读取异常 / JSON 解析出现其他异常，将覆写无效的原文件")
        return [], target_filename

def save_records(filename, data):
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"错误: 保存文件时出错: {e}")

def get_multiline_input():
    print(f"\n请输入提示词的内容（支持多行文本）")
    print(f"备注：请直接输入或粘贴内容，然后按下 Enter 换行，输入 '{END_MARK}' ，最后按下 Enter 完成输入")
    lines = []
    while True:
        try:
            line = input("> ")
            if line.strip().upper() == END_MARK:
                break
            lines.append(line)
        except EOFError:
            print("\n发现结束标记，结束输入")
            break
    return "\n".join(lines)

def main():
    records, target_filename = load_records(FILENAME)
    print("\n请输入用于标记提示词的 ID（如果不再需要记录提示词，请直接输入 'quit'）")

    while True:
        record_id = input("\n输入 ID 以继续 / quit 以退出\n> ").strip()
        if record_id.lower() == "quit":
            break

        if not record_id:
            print("ID不能为空，请重新输入 > ")
            continue

        record_value = get_multiline_input()
        new_record = {
            "id": record_id,
            "value": record_value
        }
        records.append(new_record)
        print("\n提示词已记录")

    save_records(target_filename, records)
    print(f"\n已终止记录，输入的提示词数据已保存至 {target_filename}")

if __name__ == "__main__":
    main()
